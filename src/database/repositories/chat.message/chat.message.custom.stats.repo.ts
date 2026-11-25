import { QueryTypes } from "sequelize";
import { DependencyContainer } from "tsyringe";
import { RepositoryHelper } from "../repo.helper";
import { NON_QUESTION_MESSAGE_TYPES } from "../../../services/stats/stats.constants";
import {
    BOT_FLOW_INTENTS,
    CATEGORY_OTHERS,
    LOVE_MATTERS_CATEGORIES
} from "../../../services/stats/custom/love.matters.stats.rules";

///////////////////////////////////////////////////////////////////////////////

export interface ValueCountRow {
    value: string | null;
    count: number;
}

export interface QuestionRow {
    intent: string | null;
    createdAt: Date;
}

export interface InfoCountRow {
    gender: string | null;
    age: number | null;
    count: number;
}

export interface PlatformCountRow {
    platform: string | null;
    users: number;
    interactions: number;
}

export interface UserPlatformRow {
    userPlatformID: string;
    platform: string | null;
}

export interface UserDetailsRow {
    uid: string;
    contactName: string | null;
    userName: string | null;
    interactions: number;
    firstMessageOn: Date | null;
    infoProvided: boolean;
    cmrChatTaskID: string | null;
}

export type UserDetailsSortBy = 'interactions' | 'firstMessageOn';
export type SortOrder = 'asc' | 'desc';

type Quote = (id: string) => string;

export class ChatMessageCustomStatsRepo {

    private static select = async (
        container: DependencyContainer,
        label: string,
        buildSql: (q: Quote) => string,
        replacements: Record<string, unknown>
    ): Promise<any[]> => {
        try {
            const sequelize = await RepositoryHelper.resolveEntityManager(container);
            const q: Quote = (id: string) => sequelize.getQueryInterface().quoteIdentifier(id);
            return await sequelize.query(buildSql(q), { replacements, type: QueryTypes.SELECT });
        } catch (error) {
            console.error(`Error in ChatMessageCustomStatsRepo.${label}:`, error);
            throw error;
        }
    };

    private static toValueCounts = (rows: any[]): ValueCountRow[] => {
        return rows.map((row) => ({
            value : row.value === null || row.value === undefined ? null : String(row.value),
            count : Number(row.cnt ?? 0)
        }));
    };

    // Interactions: inbound messages that are not bot UI clicks (same rule as questionsAskedCount).
    private static questionFilter = (q: Quote, alias: string): string => {
        const c = (col: string) => `${alias}.${q(col)}`;
        return `${c('direction')} = 'In' AND ${c('createdAt')} >= :start AND ${c('createdAt')} < :end ` +
            `AND (${c('messageType')} IS NULL OR ${c('messageType')} NOT IN (:nonQuestionTypes))`;
    };

    // Latest user_info row per user.
    private static latestUserInfo = (q: Quote): string => {
        return `SELECT ui.* FROM ${q('user_info')} ui ` +
            `JOIN (SELECT ${q('userPlatformID')}, MAX(${q('autoIncrementalID')}) AS ${q('maxId')} ` +
            `FROM ${q('user_info')} GROUP BY ${q('userPlatformID')}) latest ` +
            `ON latest.${q('maxId')} = ui.${q('autoIncrementalID')}`;
    };

    ///////////////////////////////////////////////////////////////////////////
    // Daily inputs (one UTC day)

    // Cases 10, 15: intent and time of every interaction of the day.
    static findQuestions = async (container: DependencyContainer, start: Date, end: Date): Promise<QuestionRow[]> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'findQuestions', (q) =>
            `SELECT m.${q('intent')}, m.${q('createdAt')} FROM ${q('chat_message')} m ` +
            `WHERE ${ChatMessageCustomStatsRepo.questionFilter(q, 'm')}`,
        { start, end, nonQuestionTypes: NON_QUESTION_MESSAGE_TYPES });
        return rows.map((row) => ({ intent: row.intent ?? null, createdAt: new Date(row.createdAt) }));
    };

    // Cases 2, 12, 13: users who provided their info that day, by raw gender and age.
    static countInfoProvided = async (
        container: DependencyContainer, start: Date, end: Date
    ): Promise<InfoCountRow[]> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countInfoProvided', (q) =>
            `SELECT ${q('userGender')} AS ${q('gender')}, ${q('userAge')} AS ${q('age')}, COUNT(*) AS ${q('cnt')} ` +
            `FROM ${q('user_info')} WHERE ${q('infoProvided')} IS TRUE ` +
            `AND ${q('createdAt')} >= :start AND ${q('createdAt')} < :end ` +
            `GROUP BY ${q('userGender')}, ${q('userAge')}`,
        { start, end });
        return rows.map((row) => ({
            gender : row.gender ?? null,
            age    : row.age === null || row.age === undefined ? null : Number(row.age),
            count  : Number(row.cnt ?? 0)
        }));
    };

    // Case 9: feedback messages of the day by type.
    static countFeedback = async (container: DependencyContainer, start: Date, end: Date): Promise<ValueCountRow[]> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countFeedback', (q) =>
            `SELECT ${q('feedbackType')} AS ${q('value')}, COUNT(*) AS ${q('cnt')} FROM ${q('chat_message')} ` +
            `WHERE ${q('feedbackType')} IS NOT NULL AND ${q('createdAt')} >= :start AND ${q('createdAt')} < :end ` +
            `GROUP BY ${q('feedbackType')}`,
        { start, end });
        return ChatMessageCustomStatsRepo.toValueCounts(rows);
    };

    // Case 16: rated bot answers of the day by sensitivity level.
    static countSensitivity = async (
        container: DependencyContainer, start: Date, end: Date
    ): Promise<ValueCountRow[]> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countSensitivity', (q) =>
            `SELECT s.${q('sensitivity')} AS ${q('value')}, COUNT(*) AS ${q('cnt')} ` +
            `FROM ${q('chat_message_sensitivity')} s ` +
            `JOIN ${q('chat_message')} m ON m.${q('id')} = s.${q('chatMessageID')} ` +
            `WHERE s.${q('sensitivity')} IS NOT NULL ` +
            `AND m.${q('createdAt')} >= :start AND m.${q('createdAt')} < :end ` +
            `GROUP BY s.${q('sensitivity')}`,
        { start, end });
        return ChatMessageCustomStatsRepo.toValueCounts(rows);
    };

    ///////////////////////////////////////////////////////////////////////////
    // Live queries (selected period)

    // Case 6: users registered in the period, with info, who asked at least one real question in it.
    static countInfoUsersWithRealQuestion = async (
        container: DependencyContainer, start: Date, end: Date
    ): Promise<number> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countInfoUsersWithRealQuestion', (q) =>
            `SELECT COUNT(DISTINCT c.${q('mobileNumber')}) AS ${q('cnt')} FROM ${q('contact_list')} c ` +
            `JOIN ${q('user_info')} u ON u.${q('userPlatformID')} = c.${q('mobileNumber')} ` +
            `AND u.${q('infoProvided')} IS TRUE ` +
            `JOIN ${q('chat_message')} m ON m.${q('userPlatformID')} = c.${q('mobileNumber')} ` +
            `WHERE c.${q('createdAt')} >= :start AND c.${q('createdAt')} < :end ` +
            `AND m.${q('direction')} = 'In' AND m.${q('createdAt')} >= :start AND m.${q('createdAt')} < :end ` +
            `AND m.${q('intent')} IS NOT NULL AND m.${q('intent')} NOT IN (:botFlowIntents)`,
        { start, end, botFlowIntents: BOT_FLOW_INTENTS });
        return Number(rows[0]?.cnt ?? 0);
    };

    // Case 8: users who messaged in the period but registered before it.
    static countReturningUsers = async (container: DependencyContainer, start: Date, end: Date): Promise<number> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countReturningUsers', (q) =>
            `SELECT COUNT(DISTINCT m.${q('userPlatformID')}) AS ${q('cnt')} FROM ${q('chat_message')} m ` +
            `JOIN ${q('contact_list')} c ON c.${q('mobileNumber')} = m.${q('userPlatformID')} ` +
            `WHERE m.${q('direction')} = 'In' AND m.${q('createdAt')} >= :start AND m.${q('createdAt')} < :end ` +
            `AND c.${q('createdAt')} < :start`,
        { start, end });
        return Number(rows[0]?.cnt ?? 0);
    };

    // Case 11: distinct users per topic. The topic rule is applied in SQL so that users are
    // counted once per topic (several intents can fall into "Others").
    static countUsersByCategory = async (
        container: DependencyContainer, start: Date, end: Date
    ): Promise<ValueCountRow[]> => {
        const replacements: Record<string, unknown> = {
            start,
            end,
            nonQuestionTypes : NON_QUESTION_MESSAGE_TYPES,
            others           : CATEGORY_OTHERS
        };
        const whens = LOVE_MATTERS_CATEGORIES.map((category, i) => {
            replacements[`key${i}`] = category.toLowerCase();
            replacements[`label${i}`] = category;
            return `WHEN :key${i} THEN :label${i}`;
        }).join(' ');
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countUsersByCategory', (q) =>
            `SELECT x.${q('value')}, COUNT(DISTINCT x.${q('userPlatformID')}) AS ${q('cnt')} FROM (` +
            `SELECT m.${q('userPlatformID')}, ` +
            `CASE LOWER(TRIM(m.${q('intent')})) ${whens} ELSE :others END AS ${q('value')} ` +
            `FROM ${q('chat_message')} m WHERE ${ChatMessageCustomStatsRepo.questionFilter(q, 'm')}` +
            `) x GROUP BY x.${q('value')}`,
        replacements);
        return ChatMessageCustomStatsRepo.toValueCounts(rows);
    };

    // Case 17: distinct users per sensitivity level of the answers they received.
    static countUsersBySensitivity = async (
        container: DependencyContainer, start: Date, end: Date
    ): Promise<ValueCountRow[]> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countUsersBySensitivity', (q) =>
            `SELECT s.${q('sensitivity')} AS ${q('value')}, COUNT(DISTINCT m.${q('userPlatformID')}) AS ${q('cnt')} ` +
            `FROM ${q('chat_message_sensitivity')} s ` +
            `JOIN ${q('chat_message')} m ON m.${q('id')} = s.${q('chatMessageID')} ` +
            `WHERE s.${q('sensitivity')} IS NOT NULL ` +
            `AND m.${q('createdAt')} >= :start AND m.${q('createdAt')} < :end ` +
            `GROUP BY s.${q('sensitivity')}`,
        { start, end });
        return ChatMessageCustomStatsRepo.toValueCounts(rows);
    };

    // Extra: users and interactions per platform (raw value; normalised by the caller).
    static countByPlatform = async (
        container: DependencyContainer, start: Date, end: Date
    ): Promise<PlatformCountRow[]> => {
        const rows = await ChatMessageCustomStatsRepo.select(container, 'countByPlatform', (q) => {
            const c = (col: string) => `m.${q(col)}`;
            const isQuestion = `(${c('messageType')} IS NULL OR ${c('messageType')} NOT IN (:nonQuestionTypes))`;
            return `SELECT ${c('platform')} AS ${q('platform')}, ` +
                `COUNT(DISTINCT ${c('userPlatformID')}) AS ${q('users')}, ` +
                `SUM(CASE WHEN ${isQuestion} THEN 1 ELSE 0 END) AS ${q('interactions')} ` +
                `FROM ${q('chat_message')} m ` +
                `WHERE ${c('direction')} = 'In' AND ${c('createdAt')} >= :start AND ${c('createdAt')} < :end ` +
                `GROUP BY ${c('platform')}`;
        }, { start, end, nonQuestionTypes: NON_QUESTION_MESSAGE_TYPES });
        return rows.map((row) => ({
            platform     : row.platform ?? null,
            users        : Number(row.users ?? 0),
            interactions : Number(row.interactions ?? 0)
        }));
    };

    // Case 18: one page of users registered in the period.
    static findRegisteredUsers = async (
        container: DependencyContainer,
        start: Date,
        end: Date,
        limit: number,
        offset: number,
        sortBy: UserDetailsSortBy,
        order: SortOrder
    ): Promise<UserDetailsRow[]> => {

        // Sort column/direction are whitelisted (user input is never interpolated directly).
        const rows = await ChatMessageCustomStatsRepo.select(container, 'findRegisteredUsers', (q) => {
            const sortColumn = sortBy === 'firstMessageOn' ? q('firstMessageOn') : q('interactions');
            const sortDirection = order === 'asc' ? 'ASC' : 'DESC';
            return `SELECT c.${q('mobileNumber')} AS ${q('uid')}, c.${q('username')} AS ${q('contactName')}, ` +
                `u.${q('userName')}, c.${q('cmrChatTaskID')}, c.${q('createdAt')} AS ${q('firstMessageOn')}, ` +
                `MAX(CASE WHEN u.${q('userPlatformID')} IS NULL THEN 0 ELSE 1 END) AS ${q('infoProvided')}, ` +
                `COUNT(m.${q('id')}) AS ${q('interactions')} ` +
                `FROM ${q('contact_list')} c ` +
                `LEFT JOIN (${ChatMessageCustomStatsRepo.latestUserInfo(q)}) u ` +
                `ON u.${q('userPlatformID')} = c.${q('mobileNumber')} AND u.${q('infoProvided')} IS TRUE ` +
                `LEFT JOIN ${q('chat_message')} m ON m.${q('userPlatformID')} = c.${q('mobileNumber')} ` +
                `AND ${ChatMessageCustomStatsRepo.questionFilter(q, 'm')} ` +
                `WHERE c.${q('createdAt')} >= :start AND c.${q('createdAt')} < :end ` +
                `GROUP BY c.${q('mobileNumber')}, c.${q('username')}, u.${q('userName')}, ` +
                `c.${q('cmrChatTaskID')}, c.${q('createdAt')} ` +
                `ORDER BY ${sortColumn} ${sortDirection}, ${q('uid')} ASC ` +
                `LIMIT :limit OFFSET :offset`;
        }, { start, end, limit, offset, nonQuestionTypes: NON_QUESTION_MESSAGE_TYPES });

        // uid (the phone number) is for internal lookups only; the service never returns it.
        return rows.map((row) => ({
            uid            : String(row.uid),
            contactName    : row.contactName ?? null,
            userName       : row.userName ?? null,
            interactions   : Number(row.interactions ?? 0),
            firstMessageOn : row.firstMessageOn ? new Date(row.firstMessageOn) : null,
            infoProvided   : Number(row.infoProvided ?? 0) === 1,
            cmrChatTaskID  : row.cmrChatTaskID ?? null
        }));
    };

    // Case 18: platforms each listed user messaged from in the period.
    static findPlatformsForUsers = async (
        container: DependencyContainer, start: Date, end: Date, userPlatformIDs: string[]
    ): Promise<UserPlatformRow[]> => {
        if (userPlatformIDs.length === 0) {
            return [];
        }
        const rows = await ChatMessageCustomStatsRepo.select(container, 'findPlatformsForUsers', (q) =>
            `SELECT DISTINCT m.${q('userPlatformID')}, m.${q('platform')} FROM ${q('chat_message')} m ` +
            `WHERE m.${q('direction')} = 'In' AND m.${q('createdAt')} >= :start AND m.${q('createdAt')} < :end ` +
            `AND m.${q('userPlatformID')} IN (:uids)`,
        { start, end, uids: userPlatformIDs });
        return rows.map((row) => ({ userPlatformID: String(row.userPlatformID), platform: row.platform ?? null }));
    };

}
