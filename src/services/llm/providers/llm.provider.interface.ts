/**
 * LLM Provider interfaces and types
 */

export interface LLMRequest {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    systemPrompt?: string;
}

export interface LLMResponse {
    content: string;
    finishReason: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    provider: string;
}

export interface LLMProviderConfig {
    apiKey: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    maxRetries?: number;
}

export interface ILLMProvider {
    /**
     * Provider name (e.g., 'openai', 'claude')
     */
    readonly providerName: string;

    /**
     * Model name (e.g., 'gpt-3.5-turbo', 'claude-3-haiku')
     */
    readonly modelName: string;

    /**
     * Generate a completion from the LLM
     * @param request - The request containing prompt and parameters
     * @returns Promise<LLMResponse>
     */
    generate(request: LLMRequest): Promise<LLMResponse>;

    /**
     * Check if the provider is healthy/available
     * @returns Promise<boolean>
     */
    healthCheck(): Promise<boolean>;
}
