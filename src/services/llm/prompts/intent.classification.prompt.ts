import { IntentDto } from '../../../domain.types/intents/intents.domain.model';

/**
 * Intent Classification Prompt Builder
 * Builds prompts for LLM-based intent classification
 */
export class IntentClassificationPromptBuilder {

    /**
     * Build a classification prompt from available intents
     * @param userMessage - The user's message to classify
     * @param availableIntents - List of available intents
     * @param language - Detected language (optional)
     * @returns Complete prompt for LLM
     */
    static buildPrompt(
        userMessage: string,
        availableIntents: IntentDto[],
        language?: string
    ): { systemPrompt: string; userPrompt: string } {
        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(userMessage, availableIntents, language);

        return { systemPrompt, userPrompt };
    }

    /**
     * Build the system prompt that instructs the LLM on its role
     * @returns System prompt string
     */
    private static buildSystemPrompt(): string {
        return `You are an intent classification system for a healthcare chatbot.
Your task is to classify user messages into ONE of the available intents.

INSTRUCTIONS:
1. Analyze the user's message carefully
2. Match it to the most appropriate intent based on descriptions and examples
3. Return your response in the exact JSON format specified
4. Include a confidence score (0.0 to 1.0) based on how well the message matches the intent
5. Provide a brief reasoning for your classification

RESPONSE FORMAT (JSON only, no additional text):
{
  "intent": "<intent_code>",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this intent was selected"
}`;
    }

    /**
     * Build the user prompt with the message and available intents
     * @param userMessage - The user's message
     * @param availableIntents - List of available intents
     * @param language - Detected language
     * @returns User prompt string
     */
    private static buildUserPrompt(
        userMessage: string,
        availableIntents: IntentDto[],
        language?: string
    ): string {
        let prompt = `USER MESSAGE: "${userMessage}"\n`;

        if (language) {
            prompt += `DETECTED LANGUAGE: ${language}\n`;
        }

        prompt += `\nAVAILABLE INTENTS:\n`;
        prompt += this.formatIntents(availableIntents);

        prompt += `\nClassify the user message into ONE of the above intents.`;
        prompt += `\nRespond with JSON only:`;

        return prompt;
    }

    /**
     * Format intents for the prompt
     * @param intents - List of intents
     * @returns Formatted intent list
     */
    private static formatIntents(intents: IntentDto[]): string {
        return intents
            .map((intent, index) => {
                let formatted = `${index + 1}. Intent Code: "${intent.Code}"\n`;
                formatted += `   Name: ${intent.Name}\n`;

                if (intent.intentDescription) {
                    formatted += `   Description: ${intent.intentDescription}\n`;
                }

                if (intent.intentExamples && intent.intentExamples.length > 0) {
                    const examples = intent.intentExamples.slice(0, 3).join('", "');
                    formatted += `   Examples: "${examples}"\n`;
                }

                return formatted;
            })
            .join('\n');
    }
}
