import { QueryTypes } from "sequelize";
import { DependencyContainer } from "tsyringe";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export interface DailyCustomStatsRow<T> {
    statDate: string;
    customStats: T;
}

export class ChatDailyStatCustomRepo {

    static dailyStatExists = async (container: DependencyContainer, statDate: string): Promise<boolean> => {
        try {
            const sequelize = await RepositoryHelper.resolveEntityManager(container);
            const q = (id: string) => sequelize.getQueryInterface().quoteIdentifier(id);
            const rows: any[] = await sequelize.query(
                `SELECT COUNT(*) AS ${q('cnt')} FROM ${q('chat_daily_stat')} WHERE ${q('statDate')} = :statDate`,
                { replacements: { statDate }, type: QueryTypes.SELECT }
            );
            return Number(rows[0]?.cnt ?? 0) > 0;
        } catch (error) {
            console.error('Error in ChatDailyStatCustomRepo.dailyStatExists:', error);
            throw error;
        }
    };

    static updateCustomStats = async (
        container: DependencyContainer, statDate: string, customStats: unknown
    ): Promise<void> => {
        try {
            const sequelize = await RepositoryHelper.resolveEntityManager(container);
            const q = (id: string) => sequelize.getQueryInterface().quoteIdentifier(id);
            await sequelize.query(
                `UPDATE ${q('chat_daily_stat')} SET ${q('customStats')} = :customStats WHERE ${q('statDate')} = :statDate`,
                { replacements: { customStats: JSON.stringify(customStats), statDate }, type: QueryTypes.UPDATE }
            );
        } catch (error) {
            console.error('Error in ChatDailyStatCustomRepo.updateCustomStats:', error);
            throw error;
        }
    };

    // Rows in [startDate, endDate) that have customStats.
    static findCustomStatsInRange = async <T>(
        container: DependencyContainer, startDate: string, endDate: string
    ): Promise<DailyCustomStatsRow<T>[]> => {
        try {
            const sequelize = await RepositoryHelper.resolveEntityManager(container);
            const q = (id: string) => sequelize.getQueryInterface().quoteIdentifier(id);
            const rows: any[] = await sequelize.query(
                `SELECT ${q('statDate')}, ${q('customStats')} FROM ${q('chat_daily_stat')} ` +
                `WHERE ${q('statDate')} >= :startDate AND ${q('statDate')} < :endDate ` +
                `AND ${q('customStats')} IS NOT NULL ORDER BY ${q('statDate')} ASC`,
                { replacements: { startDate, endDate }, type: QueryTypes.SELECT }
            );
            return rows.map((row) => ({
                statDate    : row.statDate,
                customStats : (typeof row.customStats === 'string' ? JSON.parse(row.customStats) : row.customStats) as T
            }));
        } catch (error) {
            console.error('Error in ChatDailyStatCustomRepo.findCustomStatsInRange:', error);
            throw error;
        }
    };

}
