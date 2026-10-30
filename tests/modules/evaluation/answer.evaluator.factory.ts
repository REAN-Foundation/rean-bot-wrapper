import { ConfigurationManager } from '../../config/configuration.manager';
import { EvaluationMethod } from '../../config/configuration.types';
import { IAnswerEvaluator } from './interfaces/answer.evaluator.interface';
import { SemanticSimilarityEvaluator } from './providers/semantic.similarity.evaluator';

/////////////////////////////////////////////////////////////////////////////

export class AnswerEvaluatorFactory {

    public static create = (method?: EvaluationMethod): IAnswerEvaluator => {
        const resolved = method ?? ConfigurationManager.EvaluationMethod();
        if (resolved === 'SemanticSimilarity') {
            return new SemanticSimilarityEvaluator();
        }
        throw new Error(`Unknown Evaluation.Method '${resolved}' in tests/test.config.json`);
    };

}
