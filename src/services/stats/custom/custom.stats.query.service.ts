import { DependencyContainer } from 'tsyringe';
import { TimeHelper } from '../../../common/time.helper';
import { ChatDailyStatRepo } from '../../../database/repositories/chat.daily.stat/chat.daily.stat.repo';
import { ChatDailyStatCustomRepo } from '../../../database/repositories/chat.daily.stat/chat.daily.stat.custom.repo';
import { ContactListRepo } from '../../../database/repositories/contact.list/contact.list.repo';
import {
    ChatMessageCustomStatsRepo,
    PlatformCountRow,
    SortOrder,
    UserDetailsSortBy,
    ValueCountRow
} from '../../../database/repositories/chat.message/chat.message.custom.stats.repo';
import { DateRangeResolver, ResolvedDateRange } from '../date.range.util';
import {
    CLICKUP_TASK_BASE_URL,
    GUEST_USER_NAME,
    PLATFORM_LABELS,
    PLATFORM_UNKNOWN
} from '../stats.constants';
import {
    AGE_GROUP_KEYS,
    CATEGORY_KEYS,
    FEEDBACK_KEYS,
    GENDER_KEYS,
    HOUR_KEYS,
    LoveMattersCustomStats,
    SENSITIVITY_KEYS,
    UNKNOWN
} from './love.matters.stats.rules';

///////////////////////////////////////////////////////////////////////////////

export interface PeakDay {
    date: string;
    count: number;
}

export interface PlatformDistributionItem {
    platform: string;
    users: number;
    interactions: number;
}

export interface CustomStatsSummary {
    range: ResolvedDateRange;
    totalUniqueUsers: number;                                        // 1
    usersWithInfo: number;                                           // 2
    totalInteractions: number;                                       // 3
    peakRegistrationDay: PeakDay | null;                             // 4
    peakInteractionDay: PeakDay | null;                              // 5
    usersWithInfoAndInteraction: number;                             // 6
    usersWithoutInfo: number;                                        // 7
    userClassification: { newUsers: number; returningUsers: number }; // 8
    feedback: { type: string; count: number }[];                     // 9
    categoryByInteractions: { category: string; count: number }[];   // 10
    categoryByUsers: { category: string; count: number }[];          // 11
    genderDistribution: { gender: string; count: number }[];         // 12
    ageCategory: { ageGroup: string; count: number }[];              // 13
    interactionsTimeline: { date: string; count: number }[];         // 14
    interactionsByHour: { hour: number; count: number }[];           // 15
    sensitivityByInteractions: { sensitivity: string; count: number }[]; // 16
    sensitivityByUsers: { sensitivity: string; count: number }[];    // 17
    platformDistribution: PlatformDistributionItem[];                // extra
}

export interface CustomUserDetailsItem {
    userName: string;
    userType: 'New';
    clickupLink: string | null;
    firstMessageOn: string | null;
    interactions: number;
    infoProvided: boolean;
    platforms: string[];
}

export interface CustomUserDetailsPage {
    range: ResolvedDateRange;
    total: number;
    page: number;
    pageSize: number;
    items: CustomUserDetailsItem[];
}

///////////////////////////////////////////////////////////////////////////////

const sumInto = (target: Record<string, number>, source?: Record<string, number>) => {
    if (!source) {
        return;
    }
    for (const [key, value] of Object.entries(source)) {
        target[key] = (target[key] ?? 0) + Number(value ?? 0);
    }
};

const toList = <K extends string>(bucket: Record<string, number>, knownKeys: string[], keyName: K) => {
    const keys = [...knownKeys, ...Object.keys(bucket).filter((k) => !knownKeys.includes(k))];
    return keys.map((key) => ({ [keyName]: key, count: bucket[key] ?? 0 } as { [P in K]: string } & { count: number }));
};

const valueCountsToBucket = (rows: ValueCountRow[]): Record<string, number> => {
    const bucket: Record<string, number> = {};
    for (const row of rows) {
        const key = row.value?.trim();
        if (key) {
            bucket[key] = (bucket[key] ?? 0) + row.count;
        }
    }
    return bucket;
};

const findPeak = <T>(rows: T[], dateOf: (row: T) => string, countOf: (row: T) => number): PeakDay | null => {
    let peak: PeakDay | null = null;
    for (const row of rows) {
        const count = Number(countOf(row) ?? 0);
        if (count > 0 && (!peak || count > peak.count)) {
            peak = { date: dateOf(row), count };
        }
    }
    return peak;
};

const toPlatformLabel = (value: string | null): string => {
    const key = value?.trim().toLowerCase();
    if (!key) {
        return PLATFORM_UNKNOWN;
    }
    return PLATFORM_LABELS[key] ?? value.trim();
};

const toPlatformDistribution = (rows: PlatformCountRow[]): PlatformDistributionItem[] => {
    const merged = new Map<string, PlatformDistributionItem>();
    for (const row of rows) {
        const platform = toPlatformLabel(row.platform);
        const item = merged.get(platform) ?? { platform, users: 0, interactions: 0 };
        item.users += row.users;
        item.interactions += row.interactions;
        merged.set(platform, item);
    }
    return Array.from(merged.values()).sort((a, b) => b.users - a.users);
};

///////////////////////////////////////////////////////////////////////////////

export class CustomStatsQueryService {

    private static resolveRange = async (
        container: DependencyContainer, range: string, startDate?: string, endDate?: string
    ): Promise<ResolvedDateRange> => {
        const latestAvailableDate = await ChatDailyStatRepo.findLatestStatDate(container);
        return DateRangeResolver.resolve(range, startDate, endDate, latestAvailableDate);
    };

    static getSummary = async (
        container: DependencyContainer, range: string, startDate?: string, endDate?: string
    ): Promise<CustomStatsSummary> => {
        const resolved = await CustomStatsQueryService.resolveRange(container, range, startDate, endDate);
        const start = TimeHelper.strToUtc(resolved.start);
        const end = TimeHelper.strToUtc(resolved.end);

        const [
            dailyRows,
            customRows,
            usersWithInfoAndInteraction,
            returningUsers,
            categoryUserRows,
            sensitivityUserRows,
            platformRows
        ] = await Promise.all([
            ChatDailyStatRepo.findByDateRange(container, resolved.start, resolved.end),
            ChatDailyStatCustomRepo.findCustomStatsInRange<LoveMattersCustomStats>(
                container, resolved.start, resolved.end
            ),
            ChatMessageCustomStatsRepo.countInfoUsersWithRealQuestion(container, start, end),
            ChatMessageCustomStatsRepo.countReturningUsers(container, start, end),
            ChatMessageCustomStatsRepo.countUsersByCategory(container, start, end),
            ChatMessageCustomStatsRepo.countUsersBySensitivity(container, start, end),
            ChatMessageCustomStatsRepo.countByPlatform(container, start, end)
        ]);

        const totalUniqueUsers = dailyRows.reduce((sum, r) => sum + Number(r.newUsersCount ?? 0), 0);
        const totalInteractions = dailyRows.reduce((sum, r) => sum + Number(r.questionsAskedCount ?? 0), 0);

        let usersWithInfo = 0;
        const feedback: Record<string, number> = {};
        const category: Record<string, number> = {};
        const gender: Record<string, number> = {};
        const ageGroup: Record<string, number> = {};
        const hour: Record<string, number> = {};
        const sensitivity: Record<string, number> = {};
        for (const { customStats } of customRows) {
            usersWithInfo += Number(customStats?.usersWithInfo ?? 0);
            sumInto(feedback, customStats?.feedback);
            sumInto(category, customStats?.categoryInteractions);
            sumInto(gender, customStats?.gender);
            sumInto(ageGroup, customStats?.ageGroup);
            sumInto(hour, customStats?.hour);
            sumInto(sensitivity, customStats?.sensitivity);
        }

        const usersWithoutInfo = Math.max(totalUniqueUsers - usersWithInfo, 0);
        gender[UNKNOWN] = (gender[UNKNOWN] ?? 0) + usersWithoutInfo;
        ageGroup[UNKNOWN] = (ageGroup[UNKNOWN] ?? 0) + usersWithoutInfo;

        return {
            range                       : resolved,
            totalUniqueUsers            : totalUniqueUsers,
            usersWithInfo               : usersWithInfo,
            totalInteractions           : totalInteractions,
            peakRegistrationDay         : findPeak(dailyRows, (r) => r.statDate, (r) => r.newUsersCount),
            peakInteractionDay          : findPeak(dailyRows, (r) => r.statDate, (r) => r.questionsAskedCount),
            usersWithInfoAndInteraction : usersWithInfoAndInteraction,
            usersWithoutInfo            : usersWithoutInfo,
            userClassification          : { newUsers: totalUniqueUsers, returningUsers },
            feedback                    : toList(feedback, FEEDBACK_KEYS, 'type'),
            categoryByInteractions      : toList(category, CATEGORY_KEYS, 'category'),
            categoryByUsers             : toList(valueCountsToBucket(categoryUserRows), CATEGORY_KEYS, 'category'),
            genderDistribution          : toList(gender, GENDER_KEYS, 'gender'),
            ageCategory                 : toList(ageGroup, AGE_GROUP_KEYS, 'ageGroup'),
            interactionsTimeline        : dailyRows.map((r) => ({
                date  : r.statDate,
                count : Number(r.questionsAskedCount ?? 0)
            })),
            interactionsByHour        : HOUR_KEYS.map((h) => ({ hour: Number(h), count: hour[h] ?? 0 })),
            sensitivityByInteractions : toList(sensitivity, SENSITIVITY_KEYS, 'sensitivity'),
            sensitivityByUsers        : toList(valueCountsToBucket(sensitivityUserRows), SENSITIVITY_KEYS, 'sensitivity'),
            platformDistribution      : toPlatformDistribution(platformRows)
        };
    };

    static getUserDetails = async (
        container: DependencyContainer,
        range: string,
        startDate: string | undefined,
        endDate: string | undefined,
        page: number,
        pageSize: number,
        sortBy: UserDetailsSortBy,
        order: SortOrder
    ): Promise<CustomUserDetailsPage> => {
        const resolved = await CustomStatsQueryService.resolveRange(container, range, startDate, endDate);
        const start = TimeHelper.strToUtc(resolved.start);
        const end = TimeHelper.strToUtc(resolved.end);

        const [total, rows] = await Promise.all([
            ContactListRepo.countInRange(container, start, end),
            ChatMessageCustomStatsRepo.findRegisteredUsers(
                container, start, end, pageSize, (page - 1) * pageSize, sortBy, order
            )
        ]);

        const platformRows = await ChatMessageCustomStatsRepo.findPlatformsForUsers(
            container, start, end, rows.map((row) => row.uid)
        );
        const platformsByUser = new Map<string, Set<string>>();
        for (const row of platformRows) {
            const set = platformsByUser.get(row.userPlatformID) ?? new Set<string>();
            set.add(toPlatformLabel(row.platform));
            platformsByUser.set(row.userPlatformID, set);
        }

        const items: CustomUserDetailsItem[] = rows.map((row) => ({
            userName       : row.contactName?.trim() || row.userName?.trim() || GUEST_USER_NAME,
            userType       : 'New',
            clickupLink    : row.cmrChatTaskID ? `${CLICKUP_TASK_BASE_URL}${row.cmrChatTaskID}` : null,
            firstMessageOn : row.firstMessageOn ? row.firstMessageOn.toISOString() : null,
            interactions   : row.interactions,
            infoProvided   : row.infoProvided,
            platforms      : Array.from(platformsByUser.get(row.uid) ?? []).sort()
        }));

        return { range: resolved, total, page, pageSize, items };
    };

}
