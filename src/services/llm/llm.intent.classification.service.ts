import { inject, Lifecycle, scoped } from "tsyringe";
import { LLMProviderFactory } from './providers/llm.provider.factory';
import { IntentClassificationPromptBuilder } from './prompts/intent.classification.prompt';
import { IntentClassificationLogRepo } from '../../database/repositories/llm/intent.classification.log.repo';
import { IntentRepo } from '../../database/repositories/intent/intent.repo';
import { IIntents } from '../../refactor/interface/intents/intents.interface';
import { IntentDto } from '../../domain.types/intents/intents.domain.model';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { ContainerService } from '../container/container.service';

export interface IntentClassificationResult {
    intent: string;
    confidence: number;
    reasoning: string;
    intentData?: IntentDto;
    processingTimeMs: number;
    provider: string;
    model: string;
}

@scoped(Lifecycle.ContainerScoped)
export class LLMIntentClassificationService {

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(LLMProviderFactory) private providerFactory: LLMProviderFactory
    ) {}

    /**
     * Classify an intent using LLM
     * @param userMessage - The user's message
     * @param platformId - User platform identifier
     * @param language - Detected language (optional)
     * @returns Promise<IntentClassificationResult>
     */
    async classifyIntent(
        userMessage: string,
        platformId: string,
        language?: string
    ): Promise<IntentClassificationResult> {
        const startTime = Date.now();

        try {
            // 1. Fetch available intents that are LLM-enabled
            const availableIntents = await this.getAvailableIntents();

            if (availableIntents.length === 0) {
                throw new Error('No LLM-enabled intents found');
            }

            // 2. Build classification prompt
            const { systemPrompt, userPrompt } = IntentClassificationPromptBuilder.buildPrompt(
                userMessage,
                availableIntents,
                language
            );

            // 3. Get LLM provider
            const provider = await this.providerFactory.getDefaultProvider();

            // 4. Call LLM
            const response = await provider.generate({
                prompt      : userPrompt,
                systemPrompt,
                temperature : 0,
                maxTokens   : 500
            });

            // 5. Parse response
            const classification = this.parseClassificationResponse(response.content);

            // 6. Get intent data
            const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
            const container = ContainerService.createChildContainer(clientName);
            const intentData = await IntentRepo.findIntentByCode(
                container,
                classification.intent
            );

            const processingTimeMs = Date.now() - startTime;

            const result: IntentClassificationResult = {
                intent     : classification.intent,
                confidence : classification.confidence,
                reasoning  : classification.reasoning,
                intentData : intentData || undefined,
                processingTimeMs,
                provider   : provider.providerName,
                model      : provider.modelName
            };

            // 7. Log classification
            await this.logClassification(userMessage, platformId, result, response.usage, language);

            return result;
        } catch (error) {
            console.error('Error classifying intent:', error);

            // Log error
            await this.logClassificationError(userMessage, platformId, error, Date.now() - startTime);

            throw error;
        }
    }

    /**
     * Get available intents that are LLM-enabled
     * @returns Promise<IntentDto[]>
     */
    private async getAvailableIntents(): Promise<IntentDto[]> {
        const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
        const container = ContainerService.createChildContainer(clientName);
        return await IntentRepo.findLLMEnabledIntents(container);
    }

    /**
     * Parse LLM response to extract classification
     * @param response - LLM response content
     * @returns Classification result
     */
    private parseClassificationResponse(response: string): {
        intent: string;
        confidence: number;
        reasoning: string;
    } {
        try {
            // Try to parse as JSON
            const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const parsed = JSON.parse(cleaned);

            return {
                intent     : parsed.intent || '',
                confidence : parsed.confidence || 0,
                reasoning  : parsed.reasoning || ''
            };
        } catch (error) {
            console.error('Error parsing classification response:', error);
            throw new Error('Invalid classification response format');
        }
    }

    /**
     * Log classification to database
     * @param userMessage - User message
     * @param platformId - Platform ID
     * @param result - Classification result
     * @param usage - Token usage
     * @param language - Language
     */
    private async logClassification(
        userMessage: string,
        platformId: string,
        result: IntentClassificationResult,
        usage: any,
        language?: string
    ): Promise<void> {
        try {
            const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
            const container = ContainerService.createChildContainer(clientName);
            await IntentClassificationLogRepo.create(container, {
                userPlatformId       : platformId,
                userMessage,
                detectedLanguage     : language,
                llmProvider          : result.provider,
                llmModel             : result.model,
                classifiedIntent     : result.intent,
                confidenceScore      : result.confidence,
                classificationMethod : 'llm',
                fallbackTriggered    : false,
                processingTimeMs     : result.processingTimeMs,
                tokenUsage           : usage
            });
        } catch (error) {
            console.error('Error logging classification:', error);
            // Don't throw - logging failure shouldn't break classification
        }
    }

    /**
     * Log classification error
     * @param userMessage - User message
     * @param platformId - Platform ID
     * @param error - Error object
     * @param processingTimeMs - Processing time
     */
    private async logClassificationError(
        userMessage: string,
        platformId: string,
        error: any,
        processingTimeMs: number
    ): Promise<void> {
        try {
            const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
            const container = ContainerService.createChildContainer(clientName);
            await IntentClassificationLogRepo.create(container, {
                userPlatformId       : platformId,
                userMessage,
                classificationMethod : 'llm',
                fallbackTriggered    : true,
                processingTimeMs,
                dialogflowResult     : {
                    error : error instanceof Error ? error.message : String(error)
                }
            });
        } catch (logError) {
            console.error('Error logging classification error:', logError);
        }
    }
}
