import { IntentType } from "../../messageTypes/intents/intents.message.types";

export type LLMProvider = 'dialogflow' | 'openai' | 'claude';
export type HandlerType = 'function' | 'class' | 'service';
export type ExecutionMode = 'sequential' | 'parallel';
export type ResponseType = 'static' | 'listener' | 'hybrid';
export type ButtonType = 'intent' | 'url' | 'text';

/**
 * Button configuration for static responses
 */
export interface StaticButton {
    text: string;
    type?: ButtonType;  // 'intent' | 'url' | 'text', defaults to 'text'
    value?: string;     // intentCode for 'intent', URL for 'url'
}

/**
 * Static response configuration
 * Used when responseType is 'static' or 'hybrid'
 */
export interface StaticResponseConfig {
    message: string;
    buttons?: StaticButton[];
}

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

    // Response Configuration
    responseType?: ResponseType;
    staticResponse?: StaticResponseConfig;
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
