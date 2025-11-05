import { ChatMessageDto } from "../../../domain.types/chat.message/chat.message.domain.model";
import { ChatMessage } from "../../../models/chat.message.model";

///////////////////////////////////////////////////////////////////////////////

export class ChatMessageMapper {

    static toDto = (chatMessage: ChatMessage): ChatMessageDto => {
        if (!chatMessage) {
            return null;
        }
        return {
            id                                   : chatMessage.id,
            chatSessionID                        : chatMessage.chatSessionID,
            name                                 : chatMessage.name,
            platform                             : chatMessage.platform,
            userPlatformID                       : chatMessage.userPlatformID,
            intent                               : chatMessage.intent,
            direction                            : chatMessage.direction,
            messageType                          : chatMessage.messageType,
            messageId                            : chatMessage.messageId,
            messageContent                       : chatMessage.messageContent,
            imageContent                         : chatMessage.imageContent,
            imageUrl                             : chatMessage.imageUrl,
            responseMessageID                    : chatMessage.responseMessageID,
            whatsappResponseStatusSentTimestamp  : chatMessage.whatsappResponseStatusSentTimestamp,
            whatsappResponseStatusDeliveredTimestamp : chatMessage.whatsappResponseStatusDeliveredTimestamp,
            whatsappResponseStatusReadTimestamp  : chatMessage.whatsappResponseStatusReadTimestamp,
            supportchannelName                   : chatMessage.supportchannelName,
            supportChannelTaskID                 : chatMessage.supportChannelTaskID,
            humanHandoff                         : Boolean(chatMessage.humanHandoff),
            feedbackType                         : chatMessage.feedbackType,
            messageFlag                          : chatMessage.messageFlag,
        };
    };

}
