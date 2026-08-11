export interface ISystemGeneratedMessages {
    id : string | undefined | null;
    messageName : string;
    messageContent : string;
    languageCode?: string;
}

export interface ISystemGeneratedMessageMetadata {
    id : string | undefined | null;
    messageId : string;
    customPayload?: any;
}
