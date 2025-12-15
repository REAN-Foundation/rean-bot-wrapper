import { IntentDto } from '../../domain.types/intents/intents.domain.model';
import { Intents } from '../../models/intents/intents.model';

///////////////////////////////////////////////////////////////////////////////////

export class IntentsMapper {

    static toDto = (intent: Intents): IntentDto => {
        if (intent == null){
            return null;
        }
        const dto: IntentDto = {
            id       : intent.id ? parseInt(intent.id) : undefined,
            Code     : intent.code,
            Name     : intent.name,
            Type     : intent.type,
            Metadata : intent.Metadata
        };
        return dto;
    };

}
