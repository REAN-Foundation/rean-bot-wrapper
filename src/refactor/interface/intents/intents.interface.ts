import { IntentType } from "../../messageTypes/intents/intents.message.types";

export interface IIntents {
    id: string | undefined | null;
    name: string;
    code: string;
    type: IntentType;
    Metadata: string;
}

export interface IIntentListeners {
    id: number;
    intentId: number;
    listenerCode: string;
    sequence: number;
}
