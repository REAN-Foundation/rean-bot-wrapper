import { inject, Lifecycle, scoped } from 'tsyringe';
import { LLMProviderFactory } from '../providers/llm.provider.factory';
import { EntityExtractionPromptBuilder } from '../prompts/entity.extraction.prompt';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import {
    EntityDefinition,
    ExtractedEntity,
    EntityExtractionResult
} from '../../../refactor/interface/llm/entity.collection.interfaces';

@scoped(Lifecycle.ContainerScoped)
export class EntityExtractionService {

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(LLMProviderFactory) private providerFactory: LLMProviderFactory
    ) {}

    /**
     * Extract entities from user message using LLM
     */
    async extractEntities(
        userMessage: string,
        requiredEntities: EntityDefinition[],
        conversationHistory?: Array<{userMessage: string; botResponse: string}>
    ): Promise<EntityExtractionResult> {

        try {
            // Build extraction prompt
            const { systemPrompt, userPrompt } = EntityExtractionPromptBuilder.buildPrompt(
                userMessage,
                requiredEntities,
                conversationHistory
            );

            // Get LLM provider
            const provider = await this.providerFactory.getDefaultProvider();

            // Call LLM with low temperature for consistent extraction
            const response = await provider.generate({
                prompt: userPrompt,
                systemPrompt,
                temperature: 0.1,
                maxTokens: 1000
            });

            // Parse response
            const result = this.parseExtractionResponse(response.content);

            return result;
        } catch (error) {
            console.error('[EntityExtraction] Error extracting entities:', error);
            throw error;
        }
    }

    /**
     * Parse LLM response to extract entities
     */
    private parseExtractionResponse(response: string): EntityExtractionResult {
        try {
            // Clean response (remove markdown code blocks if present)
            const cleaned = response.trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '');

            const parsed = JSON.parse(cleaned);

            const entities: ExtractedEntity[] = (parsed.entities || []).map(e => ({
                name: e.name,
                value: e.value,
                rawValue: e.raw_value || e.value,
                confidence: e.confidence || 0.8,
                validationStatus: 'pending' as const,
                extractedAt: new Date()
            }));

            return {
                entities,
                missingEntities: parsed.missing_entities || [],
                confidence: parsed.confidence || 0.8,
                reasoning: parsed.reasoning || ''
            };
        } catch (error) {
            console.error('[EntityExtraction] Error parsing extraction response:', error);
            throw new Error('Invalid entity extraction response format');
        }
    }

    /**
     * Extract a specific entity from message
     */
    async extractSingleEntity(
        userMessage: string,
        entityDefinition: EntityDefinition,
        conversationHistory?: Array<{userMessage: string; botResponse: string}>
    ): Promise<ExtractedEntity | null> {

        const result = await this.extractEntities(
            userMessage,
            [entityDefinition],
            conversationHistory
        );

        return result.entities.length > 0 ? result.entities[0] : null;
    }
}
