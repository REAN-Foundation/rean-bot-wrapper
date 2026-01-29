import { IntentType } from "../../messageTypes/intents/intents.message.types";

export type LLMProvider = 'dialogflow' | 'openai' | 'claude';
export type HandlerType = 'function' | 'class' | 'service';
export type ExecutionMode = 'sequential' | 'parallel';

export interface EntitySchema {
    [entityName: string]: {
        type: string;
        required: boolean;
        description: string;
        validation?: any;
        allowedValues?: any[];
    };
}

export interface ConversationConfig {
    maxTurns?: number;
    timeoutMinutes?: number;
    followUpStrategy?: string;
}

export interface IIntents {
    id: string | undefined | null;
    name: string;
    code: string;
    type: IntentType;
    Metadata: string;

    // LLM Configuration
    llmEnabled?: boolean;
    llmProvider?: LLMProvider;
    intentDescription?: string;
    intentExamples?: string[];

    // Entity Configuration
    entitySchema?: EntitySchema;

    // Conversation Configuration
    conversationConfig?: ConversationConfig;

    // Classification Settings
    confidenceThreshold?: number;
    fallbackToDialogflow?: boolean;
    priority?: number;
    active?: boolean;
}

export interface IIntentListeners {
    id: number;
    intentId: number;
    listenerCode: string;
    sequence: number;

    // Dynamic Handler Configuration
    handlerType?: HandlerType;
    handlerPath?: string;
    handlerConfig?: any;
    enabled?: boolean;
    executionMode?: ExecutionMode;
}
