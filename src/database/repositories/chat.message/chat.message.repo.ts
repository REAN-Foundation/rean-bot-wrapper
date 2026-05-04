import { Op } from "sequelize";
import { DependencyContainer } from "tsyringe";
import { ChatMessage } from "../../../models/chat.message.model";
import { ChatMessageDto } from "../../../domain.types/chat.message/chat.message.domain.model";
import { ChatMessageMapper } from "../../../database/mapper/chat.message.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class ChatMessageRepo {

    static hasBotRespondedToday = async (
        container: DependencyContainer,
        platformId: string
    ): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const record = await chatMessageRepository.findOne({
                where : {
                    userPlatformID : platformId,
                    direction      : 'Out',
                    createdAt      : { [Op.gte]: startOfToday }
                }
            });
            return record !== null;
        } catch (error) {
            console.error('Error in hasBotRespondedToday:', error);
            return false;
        }
    };

    static findLatestMessageByPlatformId = async (
        container: DependencyContainer,
        platformId: string
    ): Promise<ChatMessageDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            const record = await chatMessageRepository.findOne({
                where : { userPlatformID: platformId },
                order : [['createdAt', 'DESC']]
            });
            return ChatMessageMapper.toDto(record);
        } catch (error) {
            console.error('Error in findLatestMessageByPlatformId:', error);
            return null;
        }
    };

}
