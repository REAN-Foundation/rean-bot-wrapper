import { DependencyContainer } from 'tsyringe';

/**
 * LLM Event Interfaces
 * Clean, Dialogflow-independent event structure for LLM-based intent handling
 */

/**
 * Value of an extracted entity
 */
export interface EntityValue {
    value: any;
    rawValue?: string;
    confidence?: number;
}

/**
 * Message context from the user
 */
export interface MessageContext {
    text: string;
    type: string;
    timestamp: Date;
    platformId: string;
}

/**
 * Classification metadata (only present for direct LLM classification)
 */
export interface ClassificationMetadata {
    confidence: number;
    provider: string;
    model: string;
}

/**
 * Source of the intent trigger
 */
export type IntentSource = 'llm_classification' | 'entity_collection' | 'button';

/**
 * Unified event object for LLM-native intent listeners
 * Works for both direct classification and entity collection flows
 */
export interface LLMEventObject {
    // Core identifiers
    intentCode: string;
    userId: string;
    sessionId: string;
    channel: string;

    // Message context
    message: MessageContext;

    // Entities (flat structure - works for both flows)
    entities: Record<string, EntityValue>;

    // Source tracking
    source: IntentSource;

    // Classification metadata (optional - only for direct classification)
    classification?: ClassificationMetadata;

    // DI Container for service resolution
    container: DependencyContainer;
}

/**
 * Action types that listeners can trigger
 */
export type ListenerActionType =
    | 'send_message'
    | 'trigger_intent'
    | 'start_assessment'
    | 'api_call'
    | 'start_workflow';

/**
 * Action that a listener can request
 */
export interface ListenerAction {
    type: ListenerActionType;
    payload: any;
}

/**
 * Response from an LLM intent listener
 */
export interface LLMListenerResponse {
    success: boolean;
    message: string;
    data?: any;
    actions?: ListenerAction[];
}

/**
 * Interface for LLM-native intent listeners
 */
export interface ILLMIntentListener {
    /**
     * The intent code this listener handles
     */
    readonly intentCode: string;

    /**
     * Handle the intent
     * @param event The LLM event object with all context
     * @returns Response with success status and message
     */
    handle(event: LLMEventObject): Promise<LLMListenerResponse>;
}

/**
 * Type for listener handler function (alternative to class-based)
 */
export type LLMListenerHandler = (event: LLMEventObject) => Promise<LLMListenerResponse>;
