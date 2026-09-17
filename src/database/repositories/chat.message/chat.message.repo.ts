import { Op } from "sequelize";
import { DependencyContainer } from "tsyringe";
import { ChatMessage } from "../../../models/chat.message.model";
import { ChatMessageDto } from "../../../domain.types/chat.message/chat.message.domain.model";
import { ChatMessageMapper } from "../../../database/mapper/chat.message.mapper";
import { RepositoryHelper } from "../repo.helper";
import { NON_QUESTION_MESSAGE_TYPES } from "../../../services/stats/stats.constants";

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
                    userPlatformID : platformId != null ? String(platformId) : platformId,
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

    static getIncomingMessageCountToday = async (
        container: DependencyContainer,
        platformId: string
    ): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const count = await chatMessageRepository.count({
                where : {
                    userPlatformID : platformId != null ? String(platformId) : platformId,
                    direction      : 'In',
                    createdAt      : { [Op.gte]: startOfToday }
                }
            });
            return count === 1;
        } catch (error) {
            console.error('Error in getIncomingMessageCountToday:', error);
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
                where : { userPlatformID: platformId != null ? String(platformId) : platformId },
                order : [['createdAt', 'DESC']]
            });
            return ChatMessageMapper.toDto(record);
        } catch (error) {
            console.error('Error in findLatestMessageByPlatformId:', error);
            return null;
        }
    };

    static countByDirectionInRange = async (
        container: DependencyContainer,
        direction: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            return await chatMessageRepository.count({
                where : { direction, createdAt: { [Op.gte]: startDate, [Op.lt]: endDate } }
            });
        } catch (error) {
            console.error('Error in ChatMessageRepo.countByDirectionInRange:', error);
            throw error;
        }
    };

    static countQuestionsAskedInRange = async (
        container: DependencyContainer,
        startDate: Date,
        endDate: Date
    ): Promise<number> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            return await chatMessageRepository.count({
                where : {
                    direction : 'In',
                    createdAt : { [Op.gte]: startDate, [Op.lt]: endDate },
                    [Op.or]   : [
                        { messageType: null },
                        { messageType: { [Op.notIn]: NON_QUESTION_MESSAGE_TYPES } }
                    ]
                }
            });
        } catch (error) {
            console.error('Error in ChatMessageRepo.countQuestionsAskedInRange:', error);
            throw error;
        }
    };

    static findInboundMessageContentInRange = async (
        container: DependencyContainer,
        startDate: Date,
        endDate: Date
    ): Promise<string[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            const rows = await chatMessageRepository.findAll({
                where      : { direction: 'In', createdAt: { [Op.gte]: startDate, [Op.lt]: endDate } },
                attributes : ['messageContent']
            });
            return rows.map((row) => (row as any).messageContent as string);
        } catch (error) {
            console.error('Error in ChatMessageRepo.findInboundMessageContentInRange:', error);
            throw error;
        }
    };

    static countAll = async (container: DependencyContainer): Promise<number> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            return await chatMessageRepository.count();
        } catch (error) {
            console.error('Error in ChatMessageRepo.countAll:', error);
            throw error;
        }
    };

}
