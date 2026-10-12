import { Op } from "sequelize";
import { DependencyContainer } from "tsyringe";
import { ChatDailyStat } from "../../../models/chat.daily.stat.model";
import { RepositoryHelper } from "../repo.helper";
import { ChatDailyStatUpsertInput, ChatDailyStatRow } from "../../../domain.types/chat.daily.stat/chat.daily.stat.domain.model";

///////////////////////////////////////////////////////////////////////////////

export class ChatDailyStatRepo {

    static upsertDailyStat = async (
        container: DependencyContainer,
        data: ChatDailyStatUpsertInput
    ): Promise<void> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(ChatDailyStat);
            await repository.upsert(data as any);
        } catch (error) {
            console.error('Error in ChatDailyStatRepo.upsertDailyStat:', error);
            throw error;
        }
    };

    static findByDateRange = async (
        container: DependencyContainer,
        startDate: string,
        endDate: string
    ): Promise<ChatDailyStatRow[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(ChatDailyStat);
            const rows = await repository.findAll({
                where : { statDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
                order : [['statDate', 'ASC']]
            });
            return rows.map((row) => {
                const r = row as any;
                return {
                    statDate                    : r.statDate,
                    messagesReceived            : r.messagesReceived,
                    messagesSent                : r.messagesSent,
                    uniqueMessagesReceivedCount : r.uniqueMessagesReceivedCount,
                    newUsersCount               : r.newUsersCount,
                    questionsAskedCount         : r.questionsAskedCount
                };
            });
        } catch (error) {
            console.error('Error in ChatDailyStatRepo.findByDateRange:', error);
            throw error;
        }
    };

    static findLatestStatDate = async (
        container: DependencyContainer
    ): Promise<string | undefined> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(ChatDailyStat);
            const latest = await repository.findOne({ order: [['statDate', 'DESC']] });
            return latest ? (latest as any).statDate : undefined;
        } catch (error) {
            console.error('Error in ChatDailyStatRepo.findLatestStatDate:', error);
            throw error;
        }
    };

}
