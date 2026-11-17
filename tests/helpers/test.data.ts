import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { ConfigurationManager } from '../config/configuration.manager';

///////////////////////////////////////////////////////////////////////////

export type TestCase = {
    question: string;
    expected: string;
    threshold: number;
};

function parseThreshold(cell: unknown, fileName: string, excelRow: number): number {
    const text = String(cell ?? '').replace('%', '').trim();
    if (text === '') {
        return ConfigurationManager.SimilarityThreshold();
    }
    const value = Number(text);
    if (!(value >= 0 && value <= 100)) {
        throw new Error(`${fileName} row ${excelRow}: threshold must be a percentage 0-100. Got: '${cell}'`);
    }
    return value;
}

export function loadTestCases(fileName: string): TestCase[] {
    const filePath = path.join(ConfigurationManager.DownloadTemporaryFolder(), fileName);
    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Test data file not downloaded: ${filePath}. ` +
            'Is it listed in DataSources in tests/test.config.json, and did globalSetup run?');
    }

    const workbook = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], {
        header : 1,
        defval : '',
    });

    const testCases = rows
        .map((row, index) => ({ row, excelRow: index + 1 }))
        .slice(1)
        .map(({ row, excelRow }) => ({ row, excelRow, question: String(row[0] ?? '').replace(/\s+/g, ' ').trim() }))
        .filter(({ question }) => question !== '')
        .map(({ row, excelRow, question }) => ({
            question,
            expected  : String(row[1] ?? '').trim(),
            threshold : parseThreshold(row[2], fileName, excelRow),
        }));

    if (testCases.length === 0) {
        throw new Error(`No test cases found in ${filePath}`);
    }
    return testCases;
}
