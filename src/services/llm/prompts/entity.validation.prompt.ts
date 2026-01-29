import { EntityDefinition, ExtractedEntity } from '../../../refactor/interface/llm/entity.collection.interfaces';

export class EntityValidationPromptBuilder {

    static buildPrompt(
        entity: ExtractedEntity,
        definition: EntityDefinition
    ): { systemPrompt: string; userPrompt: string } {

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(entity, definition);

        return { systemPrompt, userPrompt };
    }

    private static buildSystemPrompt(): string {
        return `You are a data validation system for a healthcare chatbot.
Your task is to validate and normalize extracted entities.

INSTRUCTIONS:
1. Check if the value matches the entity definition
2. Normalize the value to the correct format
3. Identify any validation errors
4. Provide warnings for edge cases

RESPONSE FORMAT (JSON only):
{
  "is_valid": true/false,
  "normalized_value": "normalized_value_here",
  "errors": ["error1", "error2"],
  "warnings": ["warning1"]
}`;
    }

    private static buildUserPrompt(
        entity: ExtractedEntity,
        definition: EntityDefinition
    ): string {

        let prompt = `ENTITY TO VALIDATE:\n`;
        prompt += `Name: ${entity.name}\n`;
        prompt += `Value: ${entity.value}\n`;
        prompt += `Raw text: ${entity.rawValue}\n\n`;

        prompt += `VALIDATION RULES:\n`;
        prompt += `Type: ${definition.type}\n`;
        prompt += `Description: ${definition.description}\n`;

        if (definition.validation) {
            if (definition.validation.pattern) {
                prompt += `Pattern: ${definition.validation.pattern}\n`;
            }
            if (definition.validation.min !== undefined) {
                prompt += `Minimum: ${definition.validation.min}\n`;
            }
            if (definition.validation.max !== undefined) {
                prompt += `Maximum: ${definition.validation.max}\n`;
            }
            if (definition.validation.allowedValues) {
                prompt += `Allowed values: ${definition.validation.allowedValues.join(', ')}\n`;
            }
        }

        if (definition.examples && definition.examples.length > 0) {
            prompt += `Valid examples: ${definition.examples.join(', ')}\n`;
        }

        prompt += `\nValidate and normalize the value. Respond with JSON only:`;

        return prompt;
    }
}
