export interface IntentDto {
    id?: string;
    code?: string;
    name?: string;
    type?: string;
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
    // Phase 2: Response Configuration fields
    responseType?: 'static' | 'listener' | 'hybrid';
    staticResponse?: {
        message: string;
        buttons?: Array<{
            text: string;
            type?: 'intent' | 'url' | 'text';
            value?: string;
        }>;
    };
}

export interface IntentDomainModel {
    id?: string;
    code?: string;
    name?: string;
    type?: string;
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
    // Phase 2: Response Configuration fields
    responseType?: 'static' | 'listener' | 'hybrid';
    staticResponse?: {
        message: string;
        buttons?: Array<{
            text: string;
            type?: 'intent' | 'url' | 'text';
            value?: string;
        }>;
    };
}
