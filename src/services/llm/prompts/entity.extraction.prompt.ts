import { EntityDefinition } from '../../../refactor/interface/llm/entity.collection.interfaces';

export class EntityExtractionPromptBuilder {

    static buildPrompt(
        userMessage: string,
        requiredEntities: EntityDefinition[],
        conversationHistory?: Array<{userMessage: string; botResponse: string}>
    ): { systemPrompt: string; userPrompt: string } {

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(userMessage, requiredEntities, conversationHistory);

        return { systemPrompt, userPrompt };
    }

    private static buildSystemPrompt(): string {
        return `You are an entity extraction system for a healthcare chatbot.
Your task is to extract specific entities from user messages.

INSTRUCTIONS:
1. Carefully read the user's message
2. Extract ONLY the entities that are explicitly mentioned or clearly implied
3. For each entity, provide:
   - name: the entity name
   - value: the extracted value (normalized)
   - raw_value: the exact text from the message
   - confidence: 0.0-1.0 based on how certain you are
4. List any required entities that are missing
5. Do NOT guess or make up values

RESPONSE FORMAT (JSON only, no additional text):
{
  "entities": [
    {
      "name": "entity_name",
      "value": "normalized_value",
      "raw_value": "exact_text_from_message",
      "confidence": 0.9
    }
  ],
  "missing_entities": ["entity1", "entity2"],
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;
    }

    private static buildUserPrompt(
        userMessage: string,
        requiredEntities: EntityDefinition[],
        conversationHistory?: Array<{userMessage: string; botResponse: string}>
    ): string {

        let prompt = `USER MESSAGE: "${userMessage}"\n\n`;

        if (conversationHistory && conversationHistory.length > 0) {
            prompt += `CONVERSATION HISTORY:\n`;
            conversationHistory.slice(-3).forEach(turn => {
                prompt += `Bot: ${turn.botResponse}\n`;
                prompt += `User: ${turn.userMessage}\n`;
            });
            prompt += `\n`;
        }

        prompt += `REQUIRED ENTITIES:\n`;
        requiredEntities.forEach((entity, index) => {
            prompt += `${index + 1}. ${entity.name} (${entity.type}${entity.required ? ', required' : ''})\n`;
            prompt += `   Description: ${entity.description}\n`;

            if (entity.examples && entity.examples.length > 0) {
                prompt += `   Examples: ${entity.examples.slice(0, 3).join(', ')}\n`;
            }

            if (entity.validation?.allowedValues) {
                prompt += `   Allowed values: ${entity.validation.allowedValues.join(', ')}\n`;
            }

            prompt += `\n`;
        });

        prompt += `Extract entities from the user message. Consider the conversation context.`;
        prompt += `\nRespond with JSON only:`;

        return prompt;
    }
}
