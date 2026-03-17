# Revert Plan for LLM Prompt Changes

**Date:** 2026-03-13
**Changes:** Intent classification and entity extraction prompt improvements
**Test Status:** Pending user testing

## Files Modified

1. `src/services/llm/prompts/intent.classification.prompt.ts`
2. `src/services/llm/prompts/entity.extraction.prompt.ts`

## Revert Instructions

If testing shows issues, run these commands to revert:

```bash
# Navigate to project root
cd C:\Users\rocky\Documents\GitHub\rean-bot-wrapper

# Revert both files to previous version
git checkout HEAD~1 src/services/llm/prompts/intent.classification.prompt.ts
git checkout HEAD~1 src/services/llm/prompts/entity.extraction.prompt.ts

# OR if you haven't committed yet, use git stash
git stash push src/services/llm/prompts/intent.classification.prompt.ts src/services/llm/prompts/entity.extraction.prompt.ts
```

## Manual Revert (If Git Not Available)

### File 1: intent.classification.prompt.ts

**Revert Line 31-48 (buildSystemPrompt):**
```typescript
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
```

**Revert Line 57-75 (buildUserPrompt):**
```typescript
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
```

**Revert Line 82-99 (formatIntents):**
```typescript
private static formatIntents(intents: IntentDto[]): string {
    return intents
        .map((intent, index) => {
            let formatted = `${index + 1}. Intent Code: "${intent.code}"\n`;
            formatted += `   Name: ${intent.name}\n`;

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
```

### File 2: entity.extraction.prompt.ts

**Revert Line 17-46 (buildSystemPrompt):**
```typescript
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
```

**Revert Line 48-85 (buildUserPrompt):**
```typescript
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
```

## Verification After Revert

Run these checks to ensure revert was successful:

```bash
# Check git status
git status

# View the reverted files
cat src/services/llm/prompts/intent.classification.prompt.ts | grep "CRITICAL INSTRUCTIONS"
# Should return nothing if reverted successfully

cat src/services/llm/prompts/entity.extraction.prompt.ts | grep "CURRENTLY ASKING ABOUT"
# Should return nothing if reverted successfully

# Restart the application
npm run start
```

## Testing Checklist Before Committing

- [ ] Test intent classification with various messages
- [ ] Test entity collection with yes/no responses
- [ ] Check intent_classification_logs for correct intent codes
- [ ] Check entity_collection_sessions for correct entity extraction
- [ ] Verify multi-turn conversation flows work properly

## Rollback Decision Criteria

Revert if ANY of these occur:
- ❌ Intent codes not matching database (check logs)
- ❌ Entity extraction failing on yes/no responses
- ❌ Increased error rate in classification/extraction
- ❌ LLM not understanding the prompts
- ❌ Token usage significantly increased

## Notes

- Changes are designed to improve exact matching and context awareness
- May slightly increase token usage due to longer prompts
- Should significantly improve accuracy for follow-up questions
- Test with both simple and complex multi-turn conversations
