export interface ChatDailyContentStatUpsertInput {
    statDate: string;
    messageContentNormalized: string;
    messageContentSample: string;
    occurrenceCount: number;
}

export interface ContentFrequencyRow {
    content: string;
    count: number;
}
