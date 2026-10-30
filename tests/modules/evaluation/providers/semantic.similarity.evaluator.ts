import * as path from 'path';
import { env, pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';
import { Helper } from '../../../common/helper';
import { ConfigurationManager } from '../../../config/configuration.manager';
import { IAnswerEvaluator } from '../interfaces/answer.evaluator.interface';

////////////////////////////////////////////////////////////////////////////

env.cacheDir = path.join(Helper.rootDir(), '.cache', 'transformers');

let extractor: Promise<FeatureExtractionPipeline> | null = null;

const loadModel = (): Promise<FeatureExtractionPipeline> => {
    extractor ??= pipeline('feature-extraction', ConfigurationManager.SimilarityModel(), { dtype: 'fp32' });
    return extractor;
};

export class SemanticSimilarityEvaluator implements IAnswerEvaluator {

    readonly name = 'SemanticSimilarity';

    prepare = async (): Promise<void> => {
        await loadModel();
    };

    score = async (expected: string, actual: string): Promise<number> => {
        const extract = await loadModel();
        const embeddings = await extract([expected, actual], { pooling: 'mean', normalize: true });
        const [a, b] = embeddings.tolist() as number[][];

        const cosine = a.reduce((sum, value, i) => sum + value * b[i], 0);
        return Math.round(Math.max(0, cosine) * 10000) / 100;
    };

}
