/* eslint-disable indent */

// Session State Enum
export enum SessionState {
    INITIALIZED = 'initialized',
    COLLECTING = 'collecting',
    VALIDATING = 'validating',
    COMPLETED = 'completed',
    ABANDONED = 'abandoned',
    TIMEOUT = 'timeout',
    ERROR = 'error'
}

// Entity Definition - Structure for entity schema
export interface EntityDefinition {
    name: string;
    type: string; // 'string' | 'number' | 'date' | 'boolean' | 'enum'
    required: boolean;
    description: string;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        allowedValues?: any[];
        customValidator?: string;
    };
    examples?: string[];
    followUpQuestion?: string;
}

// Extracted Entity - Entity with validation status
export interface ExtractedEntity {
    name: string;
    value: any;
    rawValue: string;
    confidence: number;
    validationStatus: 'pending' | 'valid' | 'invalid';
    validationErrors?: string[];
    extractedAt: Date;
}

// Entity Collection Context - Session context with state
export interface EntityCollectionContext {
    sessionId: string;
    intentId: string;
    intentCode: string;
    userPlatformId: string;
    requiredEntities: EntityDefinition[];
    collectedEntities: Map<string, ExtractedEntity>;
    conversationHistory: ConversationTurn[];
    currentState: SessionState;
    currentTurn: number;
    maxTurns: number;
    timeoutAt: Date;
}

// Conversation Turn - Single turn in conversation history
export interface ConversationTurn {
    turn: number;
    userMessage: string;
    botResponse: string;
    entitiesExtracted: ExtractedEntity[];
    timestamp: Date;
}

// Entity Extraction Result - Result from extraction service
export interface EntityExtractionResult {
    entities: ExtractedEntity[];
    missingEntities: string[];
    confidence: number;
    reasoning: string;
}

// Question Generation Result - Generated question details
export interface QuestionGenerationResult {
    question: string;
    targetEntity: string;
    questionType: 'open' | 'confirmation' | 'clarification';
    suggestions?: string[];
}

// Entity Validation Result - Validation outcome
export interface EntityValidationResult {
    isValid: boolean;
    normalizedValue: any;
    errors: string[];
    warnings?: string[];
}

// Session Transition Result - State transition result
export interface SessionTransitionResult {
    newState: SessionState;
    action: 'continue' | 'ask_question' | 'validate' | 'complete' | 'abandon';
    data?: any;
}

// Error Types
export enum EntityCollectionErrorType {
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    SESSION_EXPIRED = 'SESSION_EXPIRED',
    EXTRACTION_FAILED = 'EXTRACTION_FAILED',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    QUESTION_GENERATION_FAILED = 'QUESTION_GENERATION_FAILED',
    LLM_ERROR = 'LLM_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR'
}

// Entity Collection Error
export class EntityCollectionError extends Error {
    constructor(
        public type: EntityCollectionErrorType,
        message: string,
        public context?: any
    ) {
        super(message);
        this.name = 'EntityCollectionError';
    }
}
