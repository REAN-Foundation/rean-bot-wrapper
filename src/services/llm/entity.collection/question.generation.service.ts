import { inject, Lifecycle, scoped } from 'tsyringe';
import { LLMProviderFactory} from '../providers/llm.provider.factory';
import { QuestionGenerationPromptBuilder } from '../prompts/question.generation.prompt';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import {
    EntityDefinition,
    QuestionGenerationResult,
    ConversationTurn
} from '../../../refactor/interface/llm/entity.collection.interfaces';

@scoped(Lifecycle.ContainerScoped)
export class QuestionGenerationService {

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(LLMProviderFactory) private providerFactory: LLMProviderFactory
    ) {}

    /**
     * Generate a question to collect a missing entity
     */
    async generateQuestion(
        entityDefinition: EntityDefinition,
        conversationHistory: ConversationTurn[],
        language?: string
    ): Promise<QuestionGenerationResult> {

        try {
            // If entity has predefined follow-up question, use it
            if (entityDefinition.followUpQuestion) {
                return {
                    question: entityDefinition.followUpQuestion,
                    targetEntity: entityDefinition.name,
                    questionType: 'open',
                    suggestions: entityDefinition.examples
                };
            }

            // Generate question using LLM
            return await this.generateQuestionWithLLM(
                entityDefinition,
                conversationHistory,
                language
            );
        } catch (error) {
            console.error('[QuestionGeneration] Error generating question:', error);
            // Fallback to simple question
            return this.generateFallbackQuestion(entityDefinition);
        }
    }

    /**
     * Generate question using LLM
     */
    private async generateQuestionWithLLM(
        entityDefinition: EntityDefinition,
        conversationHistory: ConversationTurn[],
        language?: string
    ): Promise<QuestionGenerationResult> {

        const { systemPrompt, userPrompt } = QuestionGenerationPromptBuilder.buildPrompt(
            entityDefinition,
            conversationHistory,
            language
        );

        const provider = await this.providerFactory.getDefaultProvider();

        const response = await provider.generate({
            prompt: userPrompt,
            systemPrompt,
            temperature: 0.7, // Higher temperature for more natural questions
            maxTokens: 300
        });

        return this.parseQuestionResponse(response.content, entityDefinition);
    }

    /**
     * Generate clarification question for invalid entity
     */
    async generateClarificationQuestion(
        entityDefinition: EntityDefinition,
        invalidValue: any,
        validationErrors: string[],
        conversationHistory: ConversationTurn[]
    ): Promise<QuestionGenerationResult> {

        try {
            const { systemPrompt, userPrompt } =
                QuestionGenerationPromptBuilder.buildClarificationPrompt(
                    entityDefinition,
                    invalidValue,
                    validationErrors,
                    conversationHistory
                );

            const provider = await this.providerFactory.getDefaultProvider();

            const response = await provider.generate({
                prompt: userPrompt,
                systemPrompt,
                temperature: 0.7,
                maxTokens: 300
            });

            return this.parseQuestionResponse(response.content, entityDefinition);
        } catch (error) {
            console.error('[QuestionGeneration] Error generating clarification question:', error);
            return {
                question: `I couldn't understand "${invalidValue}". ${validationErrors[0]}. Could you please provide the ${entityDefinition.description}?`,
                targetEntity: entityDefinition.name,
                questionType: 'clarification'
            };
        }
    }

    /**
     * Generate confirmation question for all collected entities
     */
    async generateConfirmationQuestion(
        collectedEntities: Map<string, any>
    ): Promise<string> {

        const entitySummary = Array.from(collectedEntities.entries())
            .map(([name, entity]) => `${name}: ${entity.value}`)
            .join(', ');

        return `I've collected the following information: ${entitySummary}. Is this correct?`;
    }

    /**
     * Parse question generation response
     */
    private parseQuestionResponse(
        response: string,
        entityDefinition: EntityDefinition
    ): QuestionGenerationResult {

        try {
            const cleaned = response.trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '');

            const parsed = JSON.parse(cleaned);

            return {
                question: parsed.question || '',
                targetEntity: entityDefinition.name,
                questionType: parsed.question_type || 'open',
                suggestions: parsed.suggestions || entityDefinition.examples
            };
        } catch (error) {
            console.error('[QuestionGeneration] Error parsing question response:', error);
            // Fallback to using response as question directly
            return {
                question: response.trim(),
                targetEntity: entityDefinition.name,
                questionType: 'open'
            };
        }
    }

    /**
     * Generate fallback question
     */
    private generateFallbackQuestion(
        entityDefinition: EntityDefinition
    ): QuestionGenerationResult {

        let question = `Please provide your ${entityDefinition.description}`;

        if (entityDefinition.examples && entityDefinition.examples.length > 0) {
            question += `. For example: ${entityDefinition.examples[0]}`;
        }

        return {
            question,
            targetEntity: entityDefinition.name,
            questionType: 'open',
            suggestions: entityDefinition.examples
        };
    }
}
