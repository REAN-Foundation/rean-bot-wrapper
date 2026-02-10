import { IntentDto } from '../../domain.types/intents/intents.domain.model';
import { Intents } from '../../models/intents/intents.model';

///////////////////////////////////////////////////////////////////////////////////

export class IntentsMapper {

    static toDto = (intent: Intents): IntentDto => {
        if (intent == null){
            return null;
        }
        const dto: IntentDto = {
            id                   : intent.id,
            code                 : intent.code,
            name                 : intent.name,
            type                 : intent.type,
            Metadata             : intent.Metadata,
            llmEnabled           : intent.llmEnabled,
            llmProvider          : intent.llmProvider,
            intentDescription    : intent.intentDescription,
            intentExamples       : intent.intentExamples,
            entitySchema         : intent.entitySchema,
            conversationConfig   : intent.conversationConfig,
            confidenceThreshold  : intent.confidenceThreshold,
            fallbackToDialogflow : intent.fallbackToDialogflow,
            priority             : intent.priority,
            active               : intent.active,
            responseType         : intent.responseType,
            staticResponse       : intent.staticResponse
        };
        return dto;
    };

}
