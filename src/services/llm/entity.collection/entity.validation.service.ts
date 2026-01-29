import { inject, Lifecycle, scoped } from 'tsyringe';
import { LLMProviderFactory } from '../providers/llm.provider.factory';
import { EntityValidationPromptBuilder } from '../prompts/entity.validation.prompt';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import {
    EntityDefinition,
    ExtractedEntity,
    EntityValidationResult
} from '../../../refactor/interface/llm/entity.collection.interfaces';

@scoped(Lifecycle.ContainerScoped)
export class EntityValidationService {

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(LLMProviderFactory) private providerFactory: LLMProviderFactory
    ) {}

    /**
     * Validate and normalize an extracted entity
     */
    async validateEntity(
        entity: ExtractedEntity,
        definition: EntityDefinition
    ): Promise<EntityValidationResult> {

        try {
            // First, try rule-based validation
            const ruleBasedResult = await this.ruleBasedValidation(entity, definition);

            if (ruleBasedResult.isValid) {
                return ruleBasedResult;
            }

            // If rule-based validation fails, use LLM for complex validation
            if (definition.validation?.customValidator || definition.type === 'string') {
                return await this.llmBasedValidation(entity, definition);
            }

            return ruleBasedResult;
        } catch (error) {
            console.error('[EntityValidation] Error validating entity:', error);
            return {
                isValid: false,
                normalizedValue: entity.value,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }

    /**
     * Rule-based validation for common types
     */
    private async ruleBasedValidation(
        entity: ExtractedEntity,
        definition: EntityDefinition
    ): Promise<EntityValidationResult> {

        const errors: string[] = [];
        let normalizedValue = entity.value;

        // Type validation
        switch (definition.type) {
            case 'number':
                normalizedValue = this.validateNumber(entity.value, definition, errors);
                break;

            case 'date':
                normalizedValue = this.validateDate(entity.value, definition, errors);
                break;

            case 'boolean':
                normalizedValue = this.validateBoolean(entity.value, definition, errors);
                break;

            case 'enum':
                normalizedValue = this.validateEnum(entity.value, definition, errors);
                break;
        }

        // Pattern validation
        if (definition.validation?.pattern && typeof normalizedValue === 'string') {
            const regex = new RegExp(definition.validation.pattern);
            if (!regex.test(normalizedValue)) {
                errors.push(`Value does not match required pattern`);
            }
        }

        return {
            isValid: errors.length === 0,
            normalizedValue,
            errors
        };
    }

    /**
     * LLM-based validation for complex cases
     */
    private async llmBasedValidation(
        entity: ExtractedEntity,
        definition: EntityDefinition
    ): Promise<EntityValidationResult> {

        try {
            const { systemPrompt, userPrompt } = EntityValidationPromptBuilder.buildPrompt(
                entity,
                definition
            );

            const provider = await this.providerFactory.getDefaultProvider();

            const response = await provider.generate({
                prompt: userPrompt,
                systemPrompt,
                temperature: 0,
                maxTokens: 500
            });

            return this.parseValidationResponse(response.content, entity);
        } catch (error) {
            console.error('[EntityValidation] Error in LLM-based validation:', error);
            throw error;
        }
    }

    /**
     * Validate number type
     */
    private validateNumber(value: any, definition: EntityDefinition, errors: string[]): number {
        const num = Number(value);

        if (isNaN(num)) {
            errors.push(`"${value}" is not a valid number`);
            return value;
        }

        if (definition.validation?.min !== undefined && num < definition.validation.min) {
            errors.push(`Value must be at least ${definition.validation.min}`);
        }

        if (definition.validation?.max !== undefined && num > definition.validation.max) {
            errors.push(`Value must be at most ${definition.validation.max}`);
        }

        return num;
    }

    /**
     * Validate date type
     */
    private validateDate(value: any, definition: EntityDefinition, errors: string[]): Date | string {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
            errors.push(`"${value}" is not a valid date`);
            return value;
        }

        return date;
    }

    /**
     * Validate boolean type
     */
    private validateBoolean(value: any, definition: EntityDefinition, errors: string[]): boolean {
        const normalized = String(value).toLowerCase();

        if (['true', 'yes', '1', 'y'].includes(normalized)) {
            return true;
        }

        if (['false', 'no', '0', 'n'].includes(normalized)) {
            return false;
        }

        errors.push(`"${value}" is not a valid boolean value`);
        return value;
    }

    /**
     * Validate enum type
     */
    private validateEnum(value: any, definition: EntityDefinition, errors: string[]): any {
        const allowedValues = definition.validation?.allowedValues || [];

        if (!allowedValues.includes(value)) {
            errors.push(`Value must be one of: ${allowedValues.join(', ')}`);
        }

        return value;
    }

    /**
     * Parse validation response from LLM
     */
    private parseValidationResponse(
        response: string,
        entity: ExtractedEntity
    ): EntityValidationResult {
        try {
            const cleaned = response.trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '');

            const parsed = JSON.parse(cleaned);

            return {
                isValid: parsed.is_valid || false,
                normalizedValue: parsed.normalized_value || entity.value,
                errors: parsed.errors || [],
                warnings: parsed.warnings
            };
        } catch (error) {
            console.error('[EntityValidation] Error parsing validation response:', error);
            throw new Error('Invalid validation response format');
        }
    }

    /**
     * Validate all collected entities
     */
    async validateAllEntities(
        entities: Map<string, ExtractedEntity>,
        definitions: EntityDefinition[]
    ): Promise<Map<string, EntityValidationResult>> {

        const results = new Map<string, EntityValidationResult>();

        for (const [name, entity] of entities.entries()) {
            const definition = definitions.find(d => d.name === name);

            if (!definition) {
                continue;
            }

            const result = await this.validateEntity(entity, definition);
            results.set(name, result);

            // Update entity validation status
            entity.validationStatus = result.isValid ? 'valid' : 'invalid';
            entity.validationErrors = result.errors;
        }

        return results;
    }
}
