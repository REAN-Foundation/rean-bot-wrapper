import { ChatMessageDto } from "../chat.message/chat.message.domain.model";

export interface ChatSessionDto {
     autoIncrementalID?: number;
    contactID: string;
    userPlatformID: string;
    preferredLanguage?: string;
    platform?: string;
    lastMessageDate?: Date;
    sessionOpen?: string;
    askForFeedback?: string;
    ChatMessage?: ChatMessageDto[];
}
