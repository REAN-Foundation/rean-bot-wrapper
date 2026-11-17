import { ConfigurationManager } from '../../config/configuration.manager';
import { EvaluationMethod } from '../../config/configuration.types';
import { IAnswerEvaluator } from './interfaces/answer.evaluator.interface';
import { LlmEvaluator } from './providers/llm.evaluator';
import { SemanticSimilarityEvaluator } from './providers/semantic.similarity.evaluator';

/////////////////////////////////////////////////////////////////////////////

export class AnswerEvaluatorFactory {

    public static create = (method?: EvaluationMethod): IAnswerEvaluator => {
        const resolved = method ?? ConfigurationManager.EvaluationMethod();
        if (resolved === 'SemanticSimilarity') {
            return new SemanticSimilarityEvaluator();
        }
        if (resolved === 'LLM') {
            return new LlmEvaluator();
        }
        throw new Error(`Unknown Evaluation.Method '${resolved}' in tests/test.config.json`);
    };

}
