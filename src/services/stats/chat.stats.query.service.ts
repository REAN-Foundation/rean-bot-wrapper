import { DependencyContainer } from 'tsyringe';
import { ChatMessageRepo } from '../../database/repositories/chat.message/chat.message.repo';
import { ContactListRepo } from '../../database/repositories/contact.list/contact.list.repo';
import { ChatDailyStatRepo } from '../../database/repositories/chat.daily.stat/chat.daily.stat.repo';
import { ChatDailyContentStatRepo } from '../../database/repositories/chat.daily.content.stat/chat.daily.content.stat.repo';
import { DateRangeResolver, ResolvedDateRange } from './date.range.util';
import { DEFAULT_CONTENT_FREQUENCY_LIMIT } from './stats.constants';

///////////////////////////////////////////////////////////////////////////////

export interface DailySeriesPoint {
    date: string;
    messagesReceived: number;
    messagesSent: number;
    newUsers: number;
    questionsAsked: number;
}

export interface ContentFrequencyItem {
    content: string;
    count: number;
}

export class ChatStatsQueryService {

    static getDailySeries = async (
        container: DependencyContainer, range: string, startDate?: string, endDate?: string
    ): Promise<{ range: ResolvedDateRange; series: DailySeriesPoint[] }> => {
        const latestAvailableDate = await ChatDailyStatRepo.findLatestStatDate(container);
        const resolved = DateRangeResolver.resolve(range, startDate, endDate, latestAvailableDate);

        const rows = await ChatDailyStatRepo.findByDateRange(container, resolved.start, resolved.end);
        const series: DailySeriesPoint[] = rows.map((row) => ({
            date             : row.statDate,
            messagesReceived : row.messagesReceived,
            messagesSent     : row.messagesSent,
            newUsers         : row.newUsersCount,
            questionsAsked   : row.questionsAskedCount
        }));

        return { range: resolved, series };
    };

    static getContentFrequency = async (
        container: DependencyContainer,
        range: string,
        startDate?: string,
        endDate?: string,
        limit: number = DEFAULT_CONTENT_FREQUENCY_LIMIT
    ): Promise<{ range: ResolvedDateRange; uniqueContentCount: number; topContent: ContentFrequencyItem[] }> => {
        const latestAvailableDate = await ChatDailyStatRepo.findLatestStatDate(container);
        const resolved = DateRangeResolver.resolve(range, startDate, endDate, latestAvailableDate);

        const [uniqueContentCount, topContent] = await Promise.all([
            ChatDailyContentStatRepo.countDistinctInRange(container, resolved.start, resolved.end),
            ChatDailyContentStatRepo.findTopContentInRange(container, resolved.start, resolved.end, limit)
        ]);

        return { range: resolved, uniqueContentCount, topContent };
    };

    static getLifetimeStats = async (
        container: DependencyContainer
    ): Promise<{ lifetimeInteractions: number; lifetimeUniqueUsers: number }> => {
        const [lifetimeInteractions, lifetimeUniqueUsers] = await Promise.all([
            ChatMessageRepo.countAll(container),
            ContactListRepo.countAll(container)
        ]);

        return { lifetimeInteractions, lifetimeUniqueUsers };
    };

}
