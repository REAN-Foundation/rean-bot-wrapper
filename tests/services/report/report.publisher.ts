import * as path from 'path';
import { Helper } from '../../common/helper';
import { ConfigurationManager } from '../../config/configuration.manager';
import { FileUpload, StorageService } from '../../modules/storage/storage.service';

////////////////////////////////////////////////////////////////////////////

const { toKey } = StorageService;

const localDate = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export class ReportPublisher {

    private static runFolder = (runStartedAt: Date): string => {
        const policy = ConfigurationManager.ReportRetentionPolicy() ?? 'Daily';
        const folder = policy === 'OnlyLatest' ? 'latest' : localDate(runStartedAt);
        return toKey(ConfigurationManager.TestEnv(), folder);
    };

    public static outputFolder = (runStartedAt: Date): string => {
        const base = ConfigurationManager.ReportsProvider() === 'Local'
            ? ConfigurationManager.ReportsLocation()
            : ConfigurationManager.ReportsTemporaryFolder();
        return path.resolve(Helper.rootDir(), base, ReportPublisher.runFolder(runStartedAt));
    };

    public static publish = async (htmlReportDir: string, reportFiles: string[], runStartedAt: Date): Promise<void> => {
        const provider = ConfigurationManager.ReportsProvider();
        const destination = toKey(ConfigurationManager.ReportsLocation(), ReportPublisher.runFolder(runStartedAt));

        const reportUploads: FileUpload[] = provider === 'Local' ? [] : reportFiles.map((filePath) => ({
            localFilePath : filePath,
            storageKey    : toKey(destination, path.basename(filePath)),
        }));
        const uploads = [
            ...reportUploads,
            ...StorageService.folderUploads(htmlReportDir, toKey(destination, 'html-report')),
        ];

        console.log(`\n[report] Publishing ${uploads.length} file(s) to ${provider}: ${destination}`);
        await StorageService.uploadAll(uploads, provider);
        console.log(`[report] Done.`);
    };

}
