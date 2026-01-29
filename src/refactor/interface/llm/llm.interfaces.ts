export type ClassificationMethod = 'llm' | 'dialogflow' | 'button';
export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'timeout';

// Intent Classification Logs Interface
export interface IIntentClassificationLog {
    id: string;
    intentId?: string;
    userPlatformId: string;
    userMessage: string;
    detectedLanguage?: string;

    // LLM Result
    llmProvider?: string;
    llmModel?: string;
    classifiedIntent?: string;
    confidenceScore?: number;

    // Decision Path
    classificationMethod: ClassificationMethod;
    fallbackTriggered: boolean;
    dialogflowResult?: any;

    // Performance Metrics
    processingTimeMs?: number;
    tokenUsage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };

    createdAt?: Date;
    updatedAt?: Date;
}

// Entity Collection Sessions Interface
export interface IEntityCollectionSession {
    id: string;
    intentId: string;
    userPlatformId: string;
    sessionId: string;

    // Session State
    status: SessionStatus;
    currentTurn: number;
    maxTurns: number;

    // Entity Collection Progress
    requiredEntities: any;
    collectedEntities: any;

    // Conversation History
    conversationHistory: Array<{
        turn: number;
        userMessage: string;
        botResponse: string;
        entitiesExtracted: any;
    }>;

    // Timing
    startedAt: Date;
    lastActivityAt: Date;
    timeoutAt: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

// Feature Flags Interface
export interface IFeatureFlag {
    id: string;
    flagName: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage: number;

    // Targeting
    targetIntents?: string[];
    targetUsers?: string[];
    targetPlatforms?: string[];

    environments?: string[];
    expiresAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

// LLM Provider Config Interface
export interface ILLMProviderConfig {
    id: string;
    providerName: string;
    modelName: string;
    apiConfig: {
        apiKeyEnvVar?: string;
        baseUrl?: string;
        temperature?: number;
        [key: string]: any;
    };

    // Capabilities
    supportsIntentClassification: boolean;
    supportsEntityExtraction: boolean;
    supportsMultilingual: boolean;

    // Performance
    maxTokens: number;
    temperature: number;
    timeoutMs: number;
    costPer1kTokens: number;

    enabled: boolean;
    priority: number;

    createdAt?: Date;
    updatedAt?: Date;
}
