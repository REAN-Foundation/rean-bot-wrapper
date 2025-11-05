import { ChatSessionDto } from "../../../domain.types/chat.session/chat.session.domain.model";
import { ChatSession } from "../../../models/chat.session";
import { ChatMessageMapper } from "../chat.message/chat.message.mapper";

///////////////////////////////////////////////////////////////////////////////

export class ChatSessionMapper {

    static toDto = (chatSession: ChatSession): ChatSessionDto => {
        if (!chatSession) {
            return null;
        }
         return {
            autoIncrementalID : chatSession.autoIncrementalID,
            contactID         : chatSession.contactID,
            userPlatformID    : chatSession.userPlatformID,
            preferredLanguage : chatSession.preferredLanguage,
            platform          : chatSession.platform,
            lastMessageDate   : chatSession.lastMessageDate,
            sessionOpen       : chatSession.sessionOpen,
            askForFeedback    : chatSession.askForFeedback,

            ChatMessage       : chatSession.ChatMessage
                ? chatSession.ChatMessage.map(msg => ChatMessageMapper.toDto(msg))
                : [],
        };
    };

}
