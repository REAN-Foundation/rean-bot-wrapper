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
Your task is to extract specific entities from user messages in a multi-turn conversation.

CRITICAL INSTRUCTIONS:
1. READ THE CONVERSATION HISTORY - the bot may have just asked a specific question
2. If the bot asked about a specific entity and the user responds with yes/no:
   - Map "yes" to the entity being true/present
   - Map "no" to the entity being false/absent
3. For boolean entities: convert yes/no/affirmative/negative responses to true/false
4. For other entities: extract the actual value from the message
5. Consider the FULL conversation context when extracting
6. Do NOT guess or make up values

EXAMPLES OF YES/NO MAPPING:
Bot: "Are you experiencing pain in your eye?"
User: "yes" → Extract: {"name": "hasPain", "value": true}

Bot: "Have you noticed vision loss?"
User: "no" → Extract: {"name": "hasVisionLoss", "value": false}

Bot: "How would you describe your pain: mild, moderate, or severe?"
User: "severe" → Extract: {"name": "painSeverity", "value": "severe"}

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
  "reasoning": "Brief explanation of what was extracted and why"
}`;
    }

    private static buildUserPrompt(
        userMessage: string,
        requiredEntities: EntityDefinition[],
        conversationHistory?: Array<{userMessage: string; botResponse: string}>
    ): string {

        let prompt = `CURRENT USER MESSAGE: "${userMessage}"\n\n`;

        // Identify which entity was just asked about
        let currentlyAskingAbout: string | null = null;
        if (conversationHistory && conversationHistory.length > 0) {
            const lastBotResponse = conversationHistory[conversationHistory.length - 1]?.botResponse;

            // Try to match the last bot response to an entity's follow-up question
            for (const entity of requiredEntities) {
                if (entity.followUpQuestion && lastBotResponse?.includes(entity.followUpQuestion)) {
                    currentlyAskingAbout = entity.name;
                    break;
                }
                // Also check if the description or name appears in the question
                if (lastBotResponse?.toLowerCase().includes(entity.name.toLowerCase()) ||
                    lastBotResponse?.toLowerCase().includes(entity.description?.toLowerCase() || '')) {
                    currentlyAskingAbout = entity.name;
                    break;
                }
            }
        }

        if (conversationHistory && conversationHistory.length > 0) {
            prompt += `CONVERSATION HISTORY (last 3 turns):\n`;
            conversationHistory.slice(-3).forEach(turn => {
                prompt += `Bot: ${turn.botResponse}\n`;
                prompt += `User: ${turn.userMessage}\n`;
            });
            prompt += `\n`;
        }

        if (currentlyAskingAbout) {
            const currentEntity = requiredEntities.find(e => e.name === currentlyAskingAbout);
            if (currentEntity) {
                prompt += `⚠️ IMPORTANT CONTEXT:\n`;
                prompt += `The bot just asked about: "${currentEntity.name}" (${currentEntity.type})\n`;
                prompt += `Question asked: "${conversationHistory[conversationHistory.length - 1]?.botResponse}"\n`;

                if (currentEntity.type === 'boolean') {
                    prompt += `This is a YES/NO question. If user responds with yes/affirmative, set this entity to TRUE.\n`;
                    prompt += `If user responds with no/negative, set this entity to FALSE.\n`;
                }

                prompt += `\n`;
            }
        }

        prompt += `REQUIRED ENTITIES TO EXTRACT:\n`;
        requiredEntities.forEach((entity, index) => {
            const isCurrent = entity.name === currentlyAskingAbout;
            prompt += `${index + 1}. ${entity.name} (${entity.type}${entity.required ? ', required' : ''})${isCurrent ? ' ← CURRENTLY ASKING ABOUT THIS' : ''}\n`;
            prompt += `   Description: ${entity.description}\n`;

            if (entity.examples && entity.examples.length > 0) {
                prompt += `   Examples: ${entity.examples.slice(0, 3).join(', ')}\n`;
            }

            if (entity.validation?.allowedValues) {
                prompt += `   Allowed values: ${entity.validation.allowedValues.join(', ')}\n`;
            }

            if (entity.type === 'boolean') {
                prompt += `   Type: Boolean (true/false for yes/no responses)\n`;
            }

            prompt += `\n`;
        });

        prompt += `\nINSTRUCTIONS:\n`;
        prompt += `1. Look at the conversation history to understand what the bot just asked\n`;
        if (currentlyAskingAbout) {
            prompt += `2. The user is responding to a question about "${currentlyAskingAbout}"\n`;
            prompt += `3. Extract "${currentlyAskingAbout}" from the user's message\n`;
        } else {
            prompt += `2. Extract any entities that are mentioned in the user's message\n`;
        }
        prompt += `4. For yes/no questions, map the response to true/false\n`;
        prompt += `5. List any required entities that are still missing\n`;
        prompt += `\nRespond with JSON only:`;

        return prompt;
    }
}
