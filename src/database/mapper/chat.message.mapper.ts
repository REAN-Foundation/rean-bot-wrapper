import { ChatMessage } from "../../models/chat.message.model";
import { ChatMessageDto } from "../../domain.types/chat.message/chat.message.domain.model";

///////////////////////////////////////////////////////////////////////////////

export class ChatMessageMapper {

    static toDto(entity: ChatMessage): ChatMessageDto | null {
        if (!entity) {
            return null;
        }
        return {
            Id             : entity.id,
            ChatSessionID  : entity.chatSessionID,
            UserPlatformID : entity.userPlatformID,
            Platform       : entity.platform,
            Name           : entity.name,
            MessageContent : entity.messageContent,
            MessageType    : entity.messageType,
            Direction      : entity.direction,
            Intent         : entity.intent,
            FeedbackType   : entity.feedbackType,
            MessageFlag    : entity.messageFlag,
            CreatedAt      : entity.createdAt,
            UpdatedAt      : entity.updatedAt,
        };
    }

}
