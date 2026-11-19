import { DependencyContainer } from 'tsyringe';
import moment from 'moment-timezone';
import { TimeHelper, DurationType } from '../../../common/time.helper';
import { Logger } from '../../../common/logger';
import { ApiError } from '../../../common/api.error';
import { ChatMessageCustomStatsRepo } from '../../../database/repositories/chat.message/chat.message.custom.stats.repo';
import { ChatDailyStatCustomRepo } from '../../../database/repositories/chat.daily.stat/chat.daily.stat.custom.repo';
import { addDaysToDateString } from '../date.range.util';
import { CUSTOM_STATS_TIMEZONE, MAX_CUSTOM_RANGE_YEARS } from '../stats.constants';
import {
    LoveMattersCustomStats,
    emptyCustomStats,
    toAgeGroup,
    toCategory,
    toGender
} from './love.matters.stats.rules';

///////////////////////////////////////////////////////////////////////////////

export interface BackfillResult {
    processed: string[];
    skippedNoDailyStat: string[];
    failed: { date: string; error: string }[];
}

const add = (bucket: Record<string, number>, key: string, count: number) => {
    bucket[key] = (bucket[key] ?? 0) + count;
};

///////////////////////////////////////////////////////////////////////////////

export class CustomStatsRollupService {

    static computeForDay = async (
        container: DependencyContainer, statDate: string
    ): Promise<LoveMattersCustomStats> => {
        const dayStart = TimeHelper.strToUtc(statDate);
        const nextDayStart = TimeHelper.addDuration(dayStart, 1, DurationType.Day);

        const [questions, infoRows, feedbackRows, sensitivityRows] = await Promise.all([
            ChatMessageCustomStatsRepo.findQuestions(container, dayStart, nextDayStart),
            ChatMessageCustomStatsRepo.countInfoProvided(container, dayStart, nextDayStart),
            ChatMessageCustomStatsRepo.countFeedback(container, dayStart, nextDayStart),
            ChatMessageCustomStatsRepo.countSensitivity(container, dayStart, nextDayStart)
        ]);

        const stats = emptyCustomStats();

        for (const question of questions) {
            add(stats.categoryInteractions, toCategory(question.intent), 1);
            add(stats.hour, String(moment.tz(question.createdAt, CUSTOM_STATS_TIMEZONE).hour()), 1);
        }

        for (const row of infoRows) {
            stats.usersWithInfo += row.count;
            add(stats.gender, toGender(row.gender), row.count);
            add(stats.ageGroup, toAgeGroup(row.age), row.count);
        }

        for (const row of feedbackRows) {
            const type = row.value?.trim();
            if (type) {
                add(stats.feedback, type, row.count);
            }
        }

        for (const row of sensitivityRows) {
            const level = row.value?.trim();
            if (level) {
                add(stats.sensitivity, level, row.count);
            }
        }

        return stats;
    };

    static computeAndStore = async (container: DependencyContainer, statDate: string): Promise<boolean> => {
        const exists = await ChatDailyStatCustomRepo.dailyStatExists(container, statDate);
        if (!exists) {
            return false;
        }
        const stats = await CustomStatsRollupService.computeForDay(container, statDate);
        await ChatDailyStatCustomRepo.updateCustomStats(container, statDate, stats);
        return true;
    };

    static backfill = async (
        container: DependencyContainer, startDate: string, endDate: string
    ): Promise<BackfillResult> => {
        const rangeDays = TimeHelper.dayDiff(TimeHelper.strToUtc(endDate), TimeHelper.strToUtc(startDate));
        if (rangeDays < 0) {
            throw new ApiError(400, 'Invalid backfill range: endDate must be on or after startDate.');
        }
        if (rangeDays > MAX_CUSTOM_RANGE_YEARS * 365) {
            throw new ApiError(400, `Backfill range cannot exceed ${MAX_CUSTOM_RANGE_YEARS} years.`);
        }

        const result: BackfillResult = { processed: [], skippedNoDailyStat: [], failed: [] };
        const endExclusive = addDaysToDateString(endDate, 1);
        for (let date = startDate; date < endExclusive; date = addDaysToDateString(date, 1)) {
            try {
                const done = await CustomStatsRollupService.computeAndStore(container, date);
                (done ? result.processed : result.skippedNoDailyStat).push(date);
            } catch (error) {
                result.failed.push({ date, error: error.message });
                Logger.instance().log(`CustomStatsRollupService.backfill: failed for ${date}: ${error.message}`);
            }
        }
        return result;
    };

}
