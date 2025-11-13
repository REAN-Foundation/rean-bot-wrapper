import { SystemGeneratedMessagesDto } from "../../../domain.types/system.generated.messages/system.generated.messages.domain.model";
import { SystemGeneratedMessages } from "../../../models/system.generated.messages.model";

///////////////////////////////////////////////////////////////////////////////

export class SystemGeneratedMessagesMapper {

    static toDto = (message: SystemGeneratedMessages): SystemGeneratedMessagesDto => {
        if (!message) {
            return null;
        }

        const dto: SystemGeneratedMessagesDto = {
            id             : message.id,
            messageName    : message.messageName,
            messageContent : message.messageContent,
            languageCode   : message.languageCode,
        };

        return dto;
    };
}
