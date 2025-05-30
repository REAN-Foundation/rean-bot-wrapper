import { IntentType } from "../../messageTypes/intents/intents.message.types";

export interface IIntents {
    autoIncrementalId: number;
    name: string;
    code: string;
    type: IntentType;
    Metadata: JSON;
}

export interface IIntentListeners {
    id: number;
    intentId: number;
    listenerCode: string;
    sequence: number;
}
