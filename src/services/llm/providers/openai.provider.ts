import { BaseLLMProvider } from './base.llm.provider';
import { LLMRequest, LLMResponse, LLMProviderConfig } from './llm.provider.interface';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * OpenAI LLM Provider implementation
 */
export class OpenAIProvider extends BaseLLMProvider {
    readonly providerName = 'openai';
    readonly modelName: string;
    private client: ChatOpenAI;

    constructor(config: LLMProviderConfig & { model: string }) {
        super(config);
        this.modelName = config.model;

        this.client = new ChatOpenAI({
            openAIApiKey: config.apiKey,
            modelName: config.model,
            temperature: config.temperature || 0,
            maxTokens: config.maxTokens || 1000,
            timeout: config.timeoutMs || 30000,
        });
    }

    /**
     * Generate a completion using OpenAI
     * @param request - The LLM request
     * @returns Promise<LLMResponse>
     */
    protected async generateInternal(request: LLMRequest): Promise<LLMResponse> {
        try {
            const messages = [];

            // Add system message if provided
            if (request.systemPrompt) {
                messages.push(new SystemMessage(request.systemPrompt));
            }

            // Add user prompt
            messages.push(new HumanMessage(request.prompt));

            // Call OpenAI (temperature and maxTokens are set in constructor)
            const response = await this.client.invoke(messages, {
                stop: request.stopSequences,
            });

            // Extract token usage from response
            const usage = {
                promptTokens: (response as any).usage_metadata?.input_tokens || 0,
                completionTokens: (response as any).usage_metadata?.output_tokens || 0,
                totalTokens: (response as any).usage_metadata?.total_tokens || 0,
            };

            return {
                content: response.content.toString(),
                finishReason: (response as any).response_metadata?.finish_reason || 'stop',
                usage,
                model: this.modelName,
                provider: this.providerName,
            };
        } catch (error) {
            console.error('OpenAI API error:', error);

            // Re-throw with more specific error information
            if (error instanceof Error) {
                throw new Error(`OpenAI API error: ${error.message}`);
            }
            throw error;
        }
    }
}
