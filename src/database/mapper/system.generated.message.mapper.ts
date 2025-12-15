import { SystemGeneratedMessagesDto } from '../../domain.types/intents/system.messages.types';
import { SystemGeneratedMessages } from '../../models/system.generated.messages.model';

///////////////////////////////////////////////////////////////////////////////////

export class systemGeneratedMessagesMapper {

    static toDto = (message: SystemGeneratedMessages): SystemGeneratedMessagesDto => {
        if (message == null){
            return null;
        }
        const dto: SystemGeneratedMessagesDto = {
            id             : message.id ? parseInt(message.id) : undefined,
            MessageName    : message.messageName,
            MessageContent : message.messageContent,
            LanguageCode   : message.languageCode,
        };
        return dto;
    }

}
