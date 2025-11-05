export interface ChatMessageDto {
    id?: number;
    chatSessionID?: number;
    name: string;
    platform: string;
    userPlatformID: string;
    intent: string;
    direction: string;
    messageType: string;
    messageId: string;
    messageContent: string;
    imageContent?: string;
    imageUrl?: string;
    responseMessageID?: string;
    whatsappResponseStatusSentTimestamp?: Date;
    whatsappResponseStatusDeliveredTimestamp?: Date;
    whatsappResponseStatusReadTimestamp?: Date;
    supportchannelName?: string;
    supportChannelTaskID?: string;
    humanHandoff?: boolean;
    feedbackType?: string;
    messageFlag?: string;
}
