import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PromptTemplate } from 'langchain/prompts';
import { ConfigurationManager } from '../../../config/configuration.manager';
import { IAnswerEvaluator } from '../interfaces/answer.evaluator.interface';

////////////////////////////////////////////////////////////////////////////

const PROMPT = PromptTemplate.fromTemplate(`
You check a health chatbot's actual answer to a user's question, using the expected answer written by its
content team as the reference. Score from 0 to 100 how well the actual answer gives the user what the
expected answer gives them, for this question.

Do not lower the score because the actual answer:
- is worded differently, is longer, or adds correct extra detail;
- is in another script or language that is the question's or the expected answer's
  (Marathi in Devanagari vs Roman letters, Hindi vs Hinglish, English);
- gives only the main points relevant to the question when the expected answer is a long list:
  missing secondary items is a minor gap, not a missing key fact.

Score 0-39 when the actual answer:
- contradicts the expected answer, or is about a different topic than the question;
- refuses or redirects ("out of my context", "outside my expertise") where the expected answer helps;
- is in a language that is neither the question's nor the expected answer's;
- is an error or system message ("unable to process", "server busy", "try again later");
- gives unsafe health advice.

A refusal, redirect or greeting matches only an expected answer that is also a refusal, redirect or greeting
with the same purpose.

Scale, with examples:
- 90-100: same key facts or same purpose.
  e.g. expected "Turn off the power, don't touch the victim", actual "Switch off the power first and don't touch the person".
- 70-89: the main points are there; a minor or secondary point is missing.
  e.g. expected lists five warning signs, actual names the three most important ones.
- 40-69: partly right; a key fact the question asks for is missing or vague.
  e.g. question "How do I give CPR?", actual gives compressions but not the rate or when to call for help.
- 0-39: see the list above.

QUESTION:
{question}

EXPECTED ANSWER:
{expected}

ACTUAL ANSWER:
{actual}

Respond with ONLY valid JSON, no markdown formatting:
{{ "score": <0-100> }}
`);

export class LlmEvaluator implements IAnswerEvaluator {

    readonly name = 'LLM';

    private _model: ChatOpenAI | null = null;

    prepare = async (): Promise<void> => {
        this.model();
    };

    score = async (question: string, expected: string, actual: string): Promise<number> => {
        const result = await PROMPT.pipe(this.model()).invoke({ question, expected, actual });
        const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);

        const score = Number(JSON.parse(content.replace(/^```(json)?|```$/g, '').trim()).score);
        if (!(score >= 0 && score <= 100)) {
            throw new Error(`LLM evaluation returned no valid score: ${content}`);
        }
        return score;
    };

    private model = (): ChatOpenAI => {
        this._model ??= new ChatOpenAI({
            modelName    : ConfigurationManager.LlmModel(),
            openAIApiKey : ConfigurationManager.LlmApiKey(),
            timeout      : 45000,
            maxRetries   : 2,
        });
        return this._model;
    };

}
