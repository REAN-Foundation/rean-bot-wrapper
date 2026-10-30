import { test, expect } from '../api.fixtures';
import { BotClient, resolveClient, testDataFile } from '../config/clients';
import { ConfigurationManager } from '../config/configuration.manager';
import { sendTextMessage, readReply, replyText, ApiChannelUser } from '../helpers/api.channel';
import { loadTestCases } from '../helpers/test.data';
import { AnswerEvaluatorFactory } from '../modules/evaluation/answer.evaluator.factory';
import { attachResult, Outcome, QuestionResult } from '../services/report/question.result';

///////////////////////////////////////////////////////////////////////////

const EMPTY_BODY = '<empty body>';

const outcomeOf = (status: number, actual: string, score: number, threshold: number): { outcome: Outcome; remarks: string } => {
    if (status !== 200) {
        return { outcome: 'http-error', remarks: `HTTP ${status}` };
    }
    if (actual === EMPTY_BODY) {
        return { outcome: 'empty-response', remarks: 'Empty response' };
    }
    if (actual.startsWith('<html>')) {
        return { outcome: 'http-error', remarks: 'HTML error page' };
    }
    if (score < threshold) {
        return { outcome: 'below-threshold', remarks: `Similarity ${score}% < ${threshold}%` };
    }
    return { outcome: 'pass', remarks: '' };
};

export function defineQuestionSuite(title: string, key: string) {
    const botClient: BotClient | undefined = resolveClient(key);

    if (!botClient) {
        test.describe(title, () => {
            test(`skipped - '${key}' not configured for this TEST_ENV`, () => {
                test.skip();
            });
        });
        return;
    }

    const testCases = loadTestCases(testDataFile(key));
    const evaluator = AnswerEvaluatorFactory.create();
    const user: ApiChannelUser = {
        platformId : ConfigurationManager.PlatformId(),
        name       : 'Playwright User',
    };

    test.describe(title, () => {

        test.describe.configure({ mode: 'default' });

        test.beforeAll(async () => {
            test.setTimeout(300000);
            await evaluator.prepare();
        });

        test.setTimeout(120000);

        testCases.forEach(({ question, expected, threshold }, index) => {
            test(`Q${index + 1}: ${question}`, async ({ apiContext }, testInfo) => {
                const tag = `[${botClient.client} Q${index + 1}]`;
                const startedAt = Date.now();
                const elapsedSeconds = () => Math.round((Date.now() - startedAt) / 100) / 10;
                const base = {
                    serialNo  : index + 1,
                    client    : botClient.client,
                    question,
                    expected,
                    threshold,
                    timestamp : new Date(startedAt).toISOString(),
                };

                console.log(`\n${tag} Sent      : ${question}`);
                console.log(`${tag} Expected  : ${expected}`);

                let status: number;
                let actual: string;
                try {
                    const response = await sendTextMessage(apiContext, botClient, user, question);
                    status = response.status();
                    actual = replyText(await readReply(response));
                } catch (error) {
                    // No response at all: record it, then fail the test.
                    const message = (error as Error).message.split('\n')[0];
                    console.log(`${tag} Network error: ${message}`);
                    await attachResult(testInfo, {
                        ...base,
                        actual          : '',
                        score           : 0,
                        httpStatus      : 0,
                        durationSeconds : elapsedSeconds(),
                        outcome         : 'network-error',
                        remarks         : message,
                    });
                    throw error;
                }

                const scorable = status === 200 && actual !== EMPTY_BODY && !actual.startsWith('<html>');
                const score = scorable ? await evaluator.score(expected, actual) : 0;
                const { outcome, remarks } = outcomeOf(status, actual, score, threshold);

                const result: QuestionResult = {
                    ...base,
                    actual,
                    score,
                    httpStatus      : status,
                    durationSeconds : elapsedSeconds(),
                    outcome,
                    remarks,
                };

                console.log(`${tag} Received  : ${actual}`);
                console.log(`${tag} Status    : ${status}   Similarity: ${score}% (threshold ${threshold}%)   Outcome: ${outcome}`);

                await attachResult(testInfo, result);

                expect(outcome, remarks || 'Outcome').toBe('pass');
            });
        });
    });
}
