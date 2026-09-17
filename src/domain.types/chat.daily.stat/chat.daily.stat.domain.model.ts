export interface ChatDailyStatUpsertInput {
    statDate: string;
    messagesReceived: number;
    messagesSent: number;
    uniqueMessagesReceivedCount: number;
    newUsersCount: number;
    questionsAskedCount: number;
}

export interface ChatDailyStatRow {
    statDate: string;
    messagesReceived: number;
    messagesSent: number;
    uniqueMessagesReceivedCount: number;
    newUsersCount: number;
    questionsAskedCount: number;
}
