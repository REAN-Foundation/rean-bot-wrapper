import type { TestInfo } from '@playwright/test';
import type { TestResult } from '@playwright/test/reporter';

///////////////////////////////////////////////////////////////////////////

export type Outcome =
    | 'pass'
    | 'below-threshold'   // 200 with an answer, but scored under the threshold
    | 'empty-response'    // 200 with an empty body
    | 'http-error'        // non-200 status (e.g. a 502 gateway page)
    | 'network-error';    // no response at all (timeout, connection error)

export type QuestionResult = {
    serialNo        : number;
    client          : string;
    question        : string;
    expected        : string;
    actual          : string;
    score           : number;
    threshold       : number;
    httpStatus      : number;   // 0 for a network error
    durationSeconds : number;
    outcome         : Outcome;
    remarks         : string;
    timestamp       : string;   // ISO 8601
};

const ATTACHMENT_NAME = 'question-result';

export const attachResult = (testInfo: TestInfo, result: QuestionResult): Promise<void> =>
    testInfo.attach(ATTACHMENT_NAME, { body: JSON.stringify(result), contentType: 'application/json' });

export const readResult = (testResult: TestResult): QuestionResult | undefined => {
    const attachment = testResult.attachments.find((a) => a.name === ATTACHMENT_NAME && a.body);
    return attachment ? JSON.parse(attachment.body!.toString('utf8')) : undefined;
};
