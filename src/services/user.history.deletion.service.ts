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

    async deleteUserProfile(userId) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const contactListRepo = entityManager.getRepository(ContactList);
            const userInfoRepo = entityManager.getRepository(UserInfo);

            const userPlatformId = userId;

            // Delete user data from Chat Session, Chat Message and Message Status tables

            await this.deleteChatHistory(userPlatformId);

            // delete user data from Contact List and User Info table

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

                console.log(`Deleted user profile for userPlatformId: ${userPlatformId}`);
            } else {
                console.log(`No ContactList entry found for mobileNumber: ${userPlatformId}`);
            }

            // Delete user from all other services

            await this.deleteUserFromAllServices(userPlatformId)

        } catch (error) {
            console.log(error);
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
    
    async deleteUserFromAllServices(user) {
        return new Promise(async (resolve, reject) => {
            try {
                Logger.instance().log(`Delete Patient API - ${this.clientEnvironmentProviderService.getClientName()}`);

                const userId = user;
                const options = this.getHeaders.getHeaders();
                const ReanBackendBaseUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL");

                const apiUrl = `${ReanBackendBaseUrl}patients/${userId}`;
                Logger.instance().log(`Calling DELETE: ${apiUrl}`);

                const response = await needle("delete", apiUrl, null, options);

                Logger.instance().log(`Response status: ${response.statusCode}`);
                Logger.instance().log(`Message: ${response.body?.message}`);

                if (response.statusCode !== 200) {
                    reject("Failed to delete patient.");
                    return;
                }

                Logger.instance().log(`Patient deleted successfully for userId: ${userId}`);
                resolve({ success: true, message: 'Patient deleted successfully.' });

            } catch (error) {
                Logger.instance().log_error(error.message, 500, "Delete Patient Service Error!");
                reject(error.message);
            }
        });
    }
    
}
