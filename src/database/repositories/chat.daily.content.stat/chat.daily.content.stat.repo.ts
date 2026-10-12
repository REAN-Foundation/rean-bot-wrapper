import { Op, fn, col } from "sequelize";
import { DependencyContainer } from "tsyringe";
import { ChatDailyContentStat } from "../../../models/chat.daily.content.stat.model";
import { RepositoryHelper } from "../repo.helper";
import {
    ChatDailyContentStatUpsertInput,
    ContentFrequencyRow
} from "../../../domain.types/chat.daily.content.stat/chat.daily.content.stat.domain.model";

///////////////////////////////////////////////////////////////////////////////

export class ChatDailyContentStatRepo {

    static upsertContentStat = async (
        container: DependencyContainer,
        data: ChatDailyContentStatUpsertInput
    ): Promise<void> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(ChatDailyContentStat);
            await repository.upsert(data as any);
        } catch (error) {
            console.error('Error in ChatDailyContentStatRepo.upsertContentStat:', error);
            throw error;
        }
    };

    static countDistinctInRange = async (
        container: DependencyContainer,
        startDate: string,
        endDate: string
    ): Promise<number> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(ChatDailyContentStat);
            const count = (await repository.count({
                distinct : true,
                col      : 'messageContentNormalized',
                where    : { statDate: { [Op.gte]: startDate, [Op.lt]: endDate } }
            } as any)) as unknown as number;
            return count;
        } catch (error) {
            console.error('Error in ChatDailyContentStatRepo.countDistinctInRange:', error);
            throw error;
        }
    };

    static findTopContentInRange = async (
        container: DependencyContainer,
        startDate: string,
        endDate: string,
        limit: number
    ): Promise<ContentFrequencyRow[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(ChatDailyContentStat);
            const rows = await repository.findAll({
                attributes : [
                    'messageContentNormalized',
                    [fn('MAX', col('messageContentSample')), 'sample'],
                    [fn('SUM', col('occurrenceCount')), 'totalCount']
                ],
                where : { statDate: { [Op.gte]: startDate, [Op.lt]: endDate } },
                group : ['messageContentNormalized'],
                order : [[fn('SUM', col('occurrenceCount')), 'DESC']],
                limit
            });
            return rows.map((row) => {
                const r = row as any;
                return {
                    content : r.get('sample'),
                    count   : Number(r.get('totalCount'))
                };
            });
        } catch (error) {
            console.error('Error in ChatDailyContentStatRepo.findTopContentInRange:', error);
            throw error;
        }
    };

}
