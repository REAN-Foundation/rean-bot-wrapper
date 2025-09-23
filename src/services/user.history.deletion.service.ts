import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { UserConsent } from '../models/user.consent.model';
import { MessageStatus } from '../models/message.status';
import { UserInfo } from '../models/user.info.model';
import { AssessmentSessionLogs } from '../models/assessment.session.model';
import { AssessmentIdentifiers } from '../models/assessment/assessment.identifiers.model';
import WorkflowUserDa from '../models/workflow.user.data.model';
import { GetHeaders } from '../services/biometrics/get.headers';
import { NeedleService } from "./needle.service";
import { Logger } from '../common/logger';

@scoped(Lifecycle.ContainerScoped)
export class userHistoryDeletionService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(GetHeaders) private getHeaders?: GetHeaders
    ){}

    async deleteUserProfile(patientUserId) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const contactListRepo = entityManager.getRepository(ContactList);
             const contact = await contactListRepo.findOne({
                where: { patientUserId }
            });

            if (!contact) {
                console.log(`No ContactList entry found for patientUserId: ${patientUserId}`);
                return;
            }
            const userPlatformId = contact.mobileNumber;

            await this.deleteChatHistory(userPlatformId);

            await this.deleteAssessmentHistory(userPlatformId)

            await this.deleteUserData(userPlatformId)

        } catch (error) {
            console.log(error);
        }
    }

    async deleteUserData(userPlatformId: string) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);

            const contactListRepo = entityManager.getRepository(ContactList);
            const userInfoRepo = entityManager.getRepository(UserInfo);
            const userConsentRepo = entityManager.getRepository(UserConsent);

            // delete from Contact List & User Info
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
                console.log(`No ContactList entry found for mobileNumber: ${userPlatformId}`);
            }

            // delete from User Consent
            await userConsentRepo.destroy({
                where: { userPlatformId }
            });

            console.log("User data deleted successfully.");
        } catch (error) {
            console.error("Error deleting user data:", error);
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
            console.log("User chat history deleted successfully.");

        } catch (error) {
            console.error("Error deleting chat history:", error);
        }
    }

    async deleteAssessmentHistory(userPlatformID: string) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);

            const assessmentSessionLogsRepo = entityManager.getRepository(AssessmentSessionLogs);
            const assessmentIdentifiersRepo = entityManager.getRepository(AssessmentIdentifiers);

            // Find all sessions for this user
            const sessions = await assessmentSessionLogsRepo.findAll({
                where: { userPlatformId: userPlatformID }
            });

            for (const session of sessions) {
                const sessionId = session.autoIncrementalID;

                // Delete identifiers for this session
                await assessmentIdentifiersRepo.destroy({
                    where: { assessmentSessionId: sessionId }
                });

                // Delete the session itself
                await assessmentSessionLogsRepo.destroy({
                    where: { autoIncrementalID: sessionId }
                });
            }

            console.log("User assessment history deleted successfully.");
        } catch (error) {
            console.error("Error deleting assessment history:", error);
        }
    }

}
