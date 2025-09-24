import { container, injectable } from 'tsyringe';
import * as asyncLib from 'async';
import { Logger } from '../common/logger';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { UserConsent } from '../models/user.consent.model';
import { MessageStatus } from '../models/message.status';
import { UserInfo } from '../models/user.info.model';
import { AssessmentSessionLogs } from '../models/assessment.session.model';
import { AssessmentIdentifiers } from '../models/assessment/assessment.identifiers.model';

////////////////////////////////////////////////////////////////////////////////////////////////////////

const ASYNC_TASK_COUNT = 4;

@injectable()
export class UserDeleteQueueService {

    private childContainer: import("tsyringe").DependencyContainer;
    private clientEnvironmentProviderService: ClientEnvironmentProviderService | null = null;
    private entityManagerProvider: EntityManagerProvider | null = null;

    constructor() {
        this.childContainer = container.createChildContainer();
        this.registerInjections();
    }

    private registerInjections(): void {
        this.childContainer.register(ClientEnvironmentProviderService, { useClass: ClientEnvironmentProviderService });
        this.childContainer.register(EntityManagerProvider, { useClass: EntityManagerProvider });
    }

    public register(client: any): void {
        try {
            this.childContainer.register("Client", { useValue: client });

            this.clientEnvironmentProviderService = this.childContainer.resolve(ClientEnvironmentProviderService);
            this.entityManagerProvider = this.childContainer.resolve(EntityManagerProvider);

            Logger.instance().log(
                `Registered client-specific services for client=${client?.name || client?.id || "unknown"}`
            );
        } catch (error) {
            Logger.instance().log(
                `Error while registering client services: ${JSON.stringify(error.message, null, 2)}`
            );
            throw error;
        }
    }

    public _q = asyncLib.queue(async (patientUserId: string, onCompleted) => {
        try {
            await this.deleteUser(patientUserId);
            onCompleted();
        } catch (error) {
            onCompleted(error);
        }
    }, ASYNC_TASK_COUNT);

    public enqueueDeleteUser = async (patientUserId: string, client) => {
        try {
            this.register(client);
            this.enqueue(patientUserId);
        } catch (error) {
            Logger.instance().log(`Enqueue error: ${JSON.stringify(error.message, null, 2)}`);
        }
    };

    private enqueue(patientUserId: string): void {
        this._q.push(patientUserId, (error) => {
            if (error) {
                Logger.instance().log(
                    `Error deleting user history for PatientUserId=${patientUserId}: ${JSON.stringify(error)}`
                );
                Logger.instance().log(
                    `Stack: ${JSON.stringify(error.stack, null, 2)}`
                );
            } else {
                Logger.instance().log(
                    `Successfully deleted user history for PatientUserId=${patientUserId}`
                );
            }
        });
    }

    private deleteUser = async (patientUserId: string) => {
        try {
            await this.deleteUserProfile(patientUserId);
        } catch (error) {
            Logger.instance().log(`Delete error for PatientUserId=${patientUserId}: ${JSON.stringify(error.message, null, 2)}`);
        }
    };

    async deleteUserProfile(patientUserId) {
        try {
            Logger.instance().log("Inside delete user profile function.");
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const contactListRepo = entityManager.getRepository(ContactList);
            const contact = await contactListRepo.findOne({
                where: { patientUserId }
            });

            if (!contact) {
                Logger.instance().log(`No ContactList entry found for patientUserId: ${patientUserId}`);
                return;
            }
            const userPlatformId = contact.mobileNumber;
            Logger.instance().log("Deleting data for " + userPlatformId);

            await this.deleteChatHistory(userPlatformId);
            await this.deleteAssessmentHistory(userPlatformId);
            await this.deleteUserData(userPlatformId);

            Logger.instance().log("User deletion complete");

        } catch (error) {
            Logger.instance().log(JSON.stringify(error, null, 2));
        }
    }

    async deleteUserData(userPlatformId: string) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);

            const contactListRepo = entityManager.getRepository(ContactList);
            const userInfoRepo = entityManager.getRepository(UserInfo);
            const userConsentRepo = entityManager.getRepository(UserConsent);

            const contact = await contactListRepo.findOne({
                where: { mobileNumber: userPlatformId }
            });

            if (contact) {
                const contactListId = contact.autoIncrementalID;

                await userInfoRepo.destroy({
                    where: { userId: contactListId }
                });

                await contactListRepo.destroy({
                    where: { autoIncrementalID: contactListId }
                });
            } else {
                Logger.instance().log(`No ContactList entry found for mobileNumber: ${userPlatformId}`);
            }

            await userConsentRepo.destroy({
                where: { userPlatformId }
            });

            Logger.instance().log("User data deleted successfully.");
        } catch (error) {
            Logger.instance().log("Error deleting user data: " + JSON.stringify(error, null, 2));
        }
    }

    async deleteChatHistory(user) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);

            const chatSessionRepo = entityManager.getRepository(ChatSession);
            const chatMessageRepo = entityManager.getRepository(ChatMessage);
            const messageStatusRepo = entityManager.getRepository(MessageStatus);

            const userPlatformID = user;

            const chatSessions = await chatSessionRepo.findAll({
                where: { userPlatformID }
            });

            for (const session of chatSessions) {
                const sessionId = session.autoIncrementalID;

                const messages = await chatMessageRepo.findAll({
                    where: { chatSessionID: sessionId }
                });

                const messageIds = messages.map(msg => msg.id);

                if (messageIds.length > 0) {
                    await messageStatusRepo.destroy({
                        where: { chatMessageId: messageIds }
                    });

                    await chatMessageRepo.destroy({
                        where: { id: messageIds }
                    });
                }

                await chatSessionRepo.destroy({
                    where: { autoIncrementalID: sessionId }
                });
            }
            Logger.instance().log("User chat history deleted successfully.");

        } catch (error) {
            Logger.instance().log("Error deleting chat history: " + JSON.stringify(error, null, 2));
        }
    }

    async deleteAssessmentHistory(userPlatformID: string) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);

            const assessmentSessionLogsRepo = entityManager.getRepository(AssessmentSessionLogs);
            const assessmentIdentifiersRepo = entityManager.getRepository(AssessmentIdentifiers);

            const sessions = await assessmentSessionLogsRepo.findAll({
                where: { userPlatformId: userPlatformID }
            });

            for (const session of sessions) {
                const sessionId = session.autoIncrementalID;

                await assessmentIdentifiersRepo.destroy({
                    where: { assessmentSessionId: sessionId }
                });

                await assessmentSessionLogsRepo.destroy({
                    where: { autoIncrementalID: sessionId }
                });
            }

            Logger.instance().log("User assessment history deleted successfully.");
        } catch (error) {
            Logger.instance().log("Error deleting assessment history: " + JSON.stringify(error, null, 2));
        }
    }
}
