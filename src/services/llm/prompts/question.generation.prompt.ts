import { EntityDefinition, ConversationTurn } from '../../../refactor/interface/llm/entity.collection.interfaces';

export class QuestionGenerationPromptBuilder {

    static buildPrompt(
        entityDefinition: EntityDefinition,
        conversationHistory: ConversationTurn[],
        language?: string
    ): { systemPrompt: string; userPrompt: string } {

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(entityDefinition, conversationHistory, language);

        return { systemPrompt, userPrompt };
    }

    static buildClarificationPrompt(
        entityDefinition: EntityDefinition,
        invalidValue: any,
        validationErrors: string[],
        conversationHistory: ConversationTurn[]
    ): { systemPrompt: string; userPrompt: string } {

        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildClarificationUserPrompt(
            entityDefinition,
            invalidValue,
            validationErrors,
            conversationHistory
        );

        return { systemPrompt, userPrompt };
    }

    private static buildSystemPrompt(): string {
        return `You are a conversational question generator for a healthcare chatbot.
Your task is to generate natural, empathetic questions to collect information from users.

INSTRUCTIONS:
1. Generate a clear, friendly question
2. Keep questions concise and easy to understand
3. Use examples when helpful
4. Match the conversational tone established in the history
5. Be empathetic and professional

RESPONSE FORMAT (JSON only):
{
  "question": "The question to ask the user",
  "question_type": "open|confirmation|clarification",
  "suggestions": ["example1", "example2"]
}`;
    }

    private static buildUserPrompt(
        entityDefinition: EntityDefinition,
        conversationHistory: ConversationTurn[],
        language?: string
    ): string {

        let prompt = `ENTITY TO COLLECT:\n`;
        prompt += `Name: ${entityDefinition.name}\n`;
        prompt += `Type: ${entityDefinition.type}\n`;
        prompt += `Description: ${entityDefinition.description}\n`;

        if (entityDefinition.examples && entityDefinition.examples.length > 0) {
            prompt += `Examples: ${entityDefinition.examples.join(', ')}\n`;
        }

        if (language) {
            prompt += `Language: ${language}\n`;
        }

        if (conversationHistory.length > 0) {
            prompt += `\nCONVERSATION HISTORY:\n`;
            conversationHistory.slice(-3).forEach(turn => {
                prompt += `Bot: ${turn.botResponse}\n`;
                prompt += `User: ${turn.userMessage}\n`;
            });
        }

        prompt += `\nGenerate a natural question to collect this entity. Respond with JSON only:`;

        return prompt;
    }

    private static buildClarificationUserPrompt(
        entityDefinition: EntityDefinition,
        invalidValue: any,
        validationErrors: string[],
        conversationHistory: ConversationTurn[]
    ): string {

        let prompt = `CLARIFICATION NEEDED:\n`;
        prompt += `Entity: ${entityDefinition.name}\n`;
        prompt += `Invalid value provided: "${invalidValue}"\n`;
        prompt += `Validation errors:\n`;
        validationErrors.forEach(error => {
            prompt += `- ${error}\n`;
        });
        prompt += `\n`;

        prompt += `ENTITY DEFINITION:\n`;
        prompt += `Type: ${entityDefinition.type}\n`;
        prompt += `Description: ${entityDefinition.description}\n`;

        if (entityDefinition.examples && entityDefinition.examples.length > 0) {
            prompt += `Valid examples: ${entityDefinition.examples.join(', ')}\n`;
        }

        if (conversationHistory.length > 0) {
            prompt += `\nCONVERSATION HISTORY:\n`;
            conversationHistory.slice(-2).forEach(turn => {
                prompt += `Bot: ${turn.botResponse}\n`;
                prompt += `User: ${turn.userMessage}\n`;
            });
        }

        prompt += `\nGenerate a friendly clarification question that explains the issue and asks for correct input. Respond with JSON only:`;

        return prompt;
    }
}
