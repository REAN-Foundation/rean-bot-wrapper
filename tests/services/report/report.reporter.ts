import * as fs from 'fs';
import * as path from 'path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { ConfigurationManager } from '../../config/configuration.manager';
import { writeClientWorkbook } from './excel.report.writer';
import { QuestionResult, readResult } from './question.result';
import { ReportPublisher } from './report.publisher';

///////////////////////////////////////////////////////////////////////////

const RESULTS_BACKUP = 'results.jsonl';

class ReportReporter implements Reporter {

    private _runStartedAt = new Date();

    private _results = new Map<string, QuestionResult[]>();

    private _backupFile: string | null = null;

    onBegin() {
        this._runStartedAt = new Date();
    }

    onTestEnd(_test: TestCase, testResult: TestResult) {
        const result = readResult(testResult);
        if (!result) {
            return;
        }
        if (!this._results.has(result.client)) {
            this._results.set(result.client, []);
        }
        this._results.get(result.client)!.push(result);
        this.appendBackup(result);
    }

    async onEnd(_result: FullResult) {
        if (this._results.size === 0) {
            return;
        }

        try {
            const outputFolder = ReportPublisher.outputFolder(this._runStartedAt);
            const reportFiles: string[] = [];
            for (const [client, results] of this._results) {
                const filePath = path.join(outputFolder, `${client}.xlsx`);
                writeClientWorkbook(filePath, client, results);
                reportFiles.push(filePath);
            }
            if (this._backupFile) {
                reportFiles.push(this._backupFile);
            }

            await ReportPublisher.publish(
                ConfigurationManager.HtmlReportTemporaryFolder(),
                reportFiles,
                this._runStartedAt);
        } catch (error) {
            console.error(`\n[report] Report failed: ${(error as Error).message}`);
            return { status: 'failed' as const };
        }
    }

    printsToStdio() {
        return false;
    }

    private appendBackup = (result: QuestionResult) => {
        try {
            if (!this._backupFile) {
                this._backupFile = path.join(ReportPublisher.outputFolder(this._runStartedAt), RESULTS_BACKUP);
                fs.mkdirSync(path.dirname(this._backupFile), { recursive: true });
                fs.writeFileSync(this._backupFile, '');
            }
            fs.appendFileSync(this._backupFile, `${JSON.stringify(result)}\n`);
        } catch (error) {
            console.error(`[report] Could not write ${RESULTS_BACKUP}: ${(error as Error).message}`);
        }
    };

}

export default ReportReporter;
