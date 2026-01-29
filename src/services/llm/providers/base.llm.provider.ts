import { ILLMProvider, LLMRequest, LLMResponse, LLMProviderConfig } from './llm.provider.interface';

/**
 * Base class for LLM providers with common functionality
 */
export abstract class BaseLLMProvider implements ILLMProvider {
    protected config: LLMProviderConfig;

    abstract readonly providerName: string;
    abstract readonly modelName: string;

    constructor(config: LLMProviderConfig) {
        this.config = {
            maxRetries: 3,
            timeoutMs: 30000,
            ...config
        };
    }

    /**
     * Generate a completion with retry logic
     * @param request - The LLM request
     * @returns Promise<LLMResponse>
     */
    async generate(request: LLMRequest): Promise<LLMResponse> {
        const maxRetries = this.config.maxRetries || 3;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await this.generateWithTimeout(request);
            } catch (error) {
                lastError = error as Error;
                console.warn(
                    `${this.providerName} attempt ${attempt + 1}/${maxRetries} failed:`,
                    error instanceof Error ? error.message : error
                );

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }

                // Exponential backoff before retry
                if (attempt < maxRetries - 1) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await this.sleep(backoffMs);
                }
            }
        }

        throw new Error(
            `${this.providerName} failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
        );
    }

    /**
     * Generate a completion with timeout
     * @param request - The LLM request
     * @returns Promise<LLMResponse>
     */
    private async generateWithTimeout(request: LLMRequest): Promise<LLMResponse> {
        const timeoutMs = this.config.timeoutMs || 30000;

        return Promise.race([
            this.generateInternal(request),
            this.timeout(timeoutMs)
        ]);
    }

    /**
     * Internal method to be implemented by each provider
     * @param request - The LLM request
     * @returns Promise<LLMResponse>
     */
    protected abstract generateInternal(request: LLMRequest): Promise<LLMResponse>;

    /**
     * Health check to verify provider is accessible
     * @returns Promise<boolean>
     */
    async healthCheck(): Promise<boolean> {
        try {
            const testRequest: LLMRequest = {
                prompt: 'Hello',
                maxTokens: 10,
                temperature: 0
            };
            await this.generate(testRequest);
            return true;
        } catch (error) {
            console.error(`${this.providerName} health check failed:`, error);
            return false;
        }
    }

    /**
     * Check if an error should not be retried
     * @param error - The error to check
     * @returns boolean
     */
    protected isNonRetryableError(error: any): boolean {
        // Don't retry on authentication errors, invalid requests, etc.
        const nonRetryableMessages = [
            'invalid_api_key',
            'invalid_request_error',
            'authentication_error',
            'permission_denied',
            'invalid_model'
        ];

        const errorMessage = error?.message?.toLowerCase() || '';
        return nonRetryableMessages.some(msg => errorMessage.includes(msg));
    }

    /**
     * Sleep for a given number of milliseconds
     * @param ms - Milliseconds to sleep
     * @returns Promise<void>
     */
    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a timeout promise
     * @param ms - Milliseconds before timeout
     * @returns Promise that rejects after timeout
     */
    private timeout(ms: number): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${this.providerName} request timed out after ${ms}ms`));
            }, ms);
        });
    }
}
