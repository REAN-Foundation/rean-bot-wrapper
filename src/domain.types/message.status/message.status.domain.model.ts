import { ChatMessageDto } from "../chat.message/chat.message.domain.model";

export interface MessageStatusDto {
    autoIncrementalID?: number;
    chatMessageId: number;
    chatMessage?: ChatMessageDto;
    channel?: string;
    messageStatus?: string;
    messageSentTimestamp?: Date;
    messageDeliveredTimestamp?: Date;
    messageReadTimestamp?: Date;
    messageRepliedTimestamp?: Date;
}
