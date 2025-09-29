import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { MessageStatus } from '../models/message.status';
import { UserInfo } from '../models/user.info.model';

@scoped(Lifecycle.ContainerScoped)
export class UserHistoryDeletionService {

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
    ){}

    async deleteUserHistory(user) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);

            const chatSessionRepo = entityManager.getRepository(ChatSession);
            const chatMessageRepo = entityManager.getRepository(ChatMessage);
            const messageStatusRepo = entityManager.getRepository(MessageStatus);
            const userInfoRepo = entityManager.getRepository(UserInfo);

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
            await userInfoRepo.destroy({
                where: { userPlatformID: userPlatformID }
            });
            console.log("User chat history deleted successfully.");

        } catch (error) {
            console.error("Error deleting chat history:", error);
        }
    }

}
