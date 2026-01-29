export interface IntentDto {
    id?: number;
    Code?: string;
    Name?: string;
    Type?: string;
    Metadata?: string;
    // Phase 1: LLM Integration fields
    llmEnabled?: boolean;
    llmProvider?: 'dialogflow' | 'openai' | 'claude';
    intentDescription?: string;
    intentExamples?: string[];
    entitySchema?: any;
    conversationConfig?: any;
    confidenceThreshold?: number;
    fallbackToDialogflow?: boolean;
    priority?: number;
    active?: boolean;
}

export interface IntentDomainModel {
    id?: number;
    Code?: string;
    Name?: string;
    Type?: string;
    Metadata?: string;
    // Phase 1: LLM Integration fields
    llmEnabled?: boolean;
    llmProvider?: 'dialogflow' | 'openai' | 'claude';
    intentDescription?: string;
    intentExamples?: string[];
    entitySchema?: any;
    conversationConfig?: any;
    confidenceThreshold?: number;
    fallbackToDialogflow?: boolean;
    priority?: number;
    active?: boolean;
}
