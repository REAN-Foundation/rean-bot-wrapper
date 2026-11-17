import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Outcome, QuestionResult } from './question.result';

///////////////////////////////////////////////////////////////////////////

const RESULTS_SHEET = 'Results';
const SUMMARY_SHEET = 'Summary';

const HEADERS = [
    'S.No', 'Client', 'Question', 'Expected Answer', 'Actual Response', 'Similarity (%)',
    'Threshold (%)', 'HTTP Status', 'Duration (s)', 'Result', 'Outcome', 'Remarks', 'Timestamp',
];

const COLUMN_WIDTHS = [6, 16, 50, 60, 60, 14, 13, 11, 12, 8, 16, 30, 22];

// Summary columns counting each kind of failure.
const OUTCOME_COLUMNS: [Exclude<Outcome, 'pass'>, string][] = [
    ['below-threshold', 'Below Threshold'],
    ['empty-response', 'Empty Response'],
    ['http-error', 'HTTP Error'],
    ['network-error', 'Network Error'],
];

// Excel rejects cell text longer than this.
const MAX_CELL_LENGTH = 32767;

const truncate = (text: string) => text.slice(0, MAX_CELL_LENGTH);

const average = (values: number[]) =>
    values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100 : 0;

const toRow = (r: QuestionResult) => ({
    'S.No'            : r.serialNo,
    'Client'          : r.client,
    'Question'        : r.question,
    'Expected Answer' : truncate(r.expected),
    'Actual Response' : truncate(r.actual),
    'Similarity (%)'  : r.score,
    'Threshold (%)'   : r.threshold,
    'HTTP Status'     : r.httpStatus,
    'Duration (s)'    : r.durationSeconds,
    'Result'          : r.outcome === 'pass' ? 'Pass' : 'Fail',
    'Outcome'         : r.outcome,
    'Remarks'         : r.remarks,
    'Timestamp'       : new Date(r.timestamp).toLocaleString(),
});

const buildSummary = (client: string, results: QuestionResult[]) => {
    const passed = results.filter((r) => r.outcome === 'pass').length;
    const summary: Record<string, string | number> = {
        'Client' : client,
        'Total'  : results.length,
        'Passed' : passed,
        'Failed' : results.length - passed,
        'Pass %' : results.length ? Math.round((passed / results.length) * 10000) / 100 : 0,
    };
    for (const [outcome, column] of OUTCOME_COLUMNS) {
        summary[column] = results.filter((r) => r.outcome === outcome).length;
    }
    summary['Avg Similarity (%)'] = average(results.map((r) => r.score));
    summary['Avg Duration (s)'] = average(results.map((r) => r.durationSeconds));
    return [summary];
};

export const writeClientWorkbook = (filePath: string, client: string, results: QuestionResult[]): void => {
    const sorted = [...results].sort((a, b) => a.serialNo - b.serialNo);

    const resultsSheet = XLSX.utils.json_to_sheet(sorted.map(toRow), { header: HEADERS });
    resultsSheet['!cols'] = COLUMN_WIDTHS.map((wch) => ({ wch }));

    const summaryRows = buildSummary(client, sorted);
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = Object.keys(summaryRows[0]).map(() => ({ wch: 18 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, resultsSheet, RESULTS_SHEET);
    XLSX.utils.book_append_sheet(workbook, summarySheet, SUMMARY_SHEET);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    XLSX.writeFile(workbook, filePath);
};
