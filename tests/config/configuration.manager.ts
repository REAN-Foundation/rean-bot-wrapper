import * as path from 'path';
import * as testConfiguration from '../test.config.json';
import { Helper } from '../common/helper';
import {
    DataSourceConfig,
    EvaluationMethod,
    FileStorageProvider,
    ReportRetentionPolicy,
    TemporaryFoldersConfig,
    TestConfigurations,
} from './configuration.types';

////////////////////////////////////////////////////////////////////////////

const requiredEnv = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} is not set in .env`);
    }
    return value;
};

export class ConfigurationManager {

    static _config: TestConfigurations | null = null;

    public static loadConfigurations = (): void => {
        ConfigurationManager._config = testConfiguration as TestConfigurations;
    };

    private static config = (): TestConfigurations => {
        if (!ConfigurationManager._config) {
            ConfigurationManager.loadConfigurations();
        }
        return ConfigurationManager._config as TestConfigurations;
    };

    public static validate = (): void => {
        const testEnv = ConfigurationManager.TestEnv();
        const environments = Object.keys(ConfigurationManager.config().Environments ?? {});
        if (!environments.includes(testEnv)) {
            throw new Error(
                `No Environments entry for TEST_ENV '${testEnv}' in tests/test.config.json. ` +
                `Configured: ${environments.join(', ') || '(none)'}`);
        }
        ConfigurationManager.BaseUrl();
        ConfigurationManager.ApiKey();
        ConfigurationManager.PlatformId();
        ConfigurationManager.SimilarityThreshold();
        ConfigurationManager.ReportsLocation();
        ConfigurationManager.DownloadTemporaryFolder();
        ConfigurationManager.HtmlReportTemporaryFolder();
        ConfigurationManager.ReportsTemporaryFolder();
        ConfigurationManager.TestDataSources();
    };

    // From .env ////////////////////////////////////////////////////////////

    public static TestEnv = (): string => {
        return requiredEnv('TEST_ENV');
    };

    // Trailing slash matters: APIRequestContext resolves a relative path like
    // 'rean/api/x/receive' against this the same way a browser resolves an
    // <a href>. Without it, the path would replace the last segment of
    // baseURL instead of appending to it.
    public static BaseUrl = (): string => {
        return requiredEnv('TEST_BASE_URL').replace(/\/*$/, '/');
    };

    public static ApiKey = (): string => {
        return requiredEnv('TEST_API_KEY');
    };

    public static PlatformId = (): string => {
        return requiredEnv('TEST_PLATFORM_ID');
    };

    // From test.config.json ////////////////////////////////////////////////

    // Tenant name of a client in the current TEST_ENV, or undefined when the
    // client isn't configured for it (its tests are then skipped).
    public static ClientName = (key: string): string | undefined => {
        return ConfigurationManager.config().Environments?.[ConfigurationManager.TestEnv()]?.Clients?.[key];
    };

    // Default minimum similarity (%) for a question to pass; a question's
    // own Threshold cell (column C of its test-case file) overrides it.
    public static SimilarityThreshold = (): number => {
        const threshold = Number(ConfigurationManager.config().Similarity?.Threshold ?? 85);
        if (!(threshold >= 0 && threshold <= 100)) {
            throw new Error(`Similarity.Threshold must be a percentage 0-100. Got: '${threshold}'`);
        }
        return threshold;
    };

    public static SimilarityModel = (): string => {
        return ConfigurationManager.config().Similarity?.Model || 'Xenova/all-MiniLM-L6-v2';
    };

    public static EvaluationMethod = (): EvaluationMethod => {
        return ConfigurationManager.config().Evaluation?.Method ?? 'SemanticSimilarity';
    };

    public static FileStorageProvider = (): FileStorageProvider | undefined => {
        return ConfigurationManager.config().FileStorage.Provider;
    };

    // Local working folders, each relative to the repository root. Keep
    // .gitignore and the CI artifact paths in step when changing them.
    private static temporaryFolder = (name: keyof TemporaryFoldersConfig): string => {
        const location = ConfigurationManager.config().TemporaryFolders?.[name]?.trim();
        if (!location) {
            throw new Error(`TemporaryFolders.${name} is not configured.`);
        }
        return path.join(Helper.rootDir(), location);
    };

    // Where the test-case files are downloaded to and read from.
    public static DownloadTemporaryFolder = (): string => {
        return ConfigurationManager.temporaryFolder('Download');
    };

    // Where Playwright writes its HTML report.
    public static HtmlReportTemporaryFolder = (): string => {
        return ConfigurationManager.temporaryFolder('HtmlReport');
    };

    // Where the Excel reports are built before an AWS-S3 upload.
    public static ReportsTemporaryFolder = (): string => {
        return ConfigurationManager.temporaryFolder('Reports');
    };

    public static ReportsProvider = (): FileStorageProvider | undefined => {
        return ConfigurationManager.config().Reports?.Provider;
    };

    // Where reports go: '<bucket>/<prefix>' for AWS-S3, or a folder
    // (absolute, or relative to the repository root) for Local.
    public static ReportsLocation = (): string => {
        const location = ConfigurationManager.config().Reports?.Location?.trim();
        if (!location) {
            throw new Error('Reports.Location is not configured.');
        }
        return location;
    };

    public static ReportRetentionPolicy = (): ReportRetentionPolicy | undefined => {
        return ConfigurationManager.config().ReportRetention.Policy;
    };

    public static DataSources = (): DataSourceConfig[] => {
        return ConfigurationManager.config().DataSources || [];
    };

    public static getDataSource = (name: string): DataSourceConfig | undefined => {
        return ConfigurationManager.DataSources().find((d) => d.Name === name);
    };

    // File name of a client's test-case workbook: both its DataSources Name
    // and its file name in the TemporaryFolders.Download folder.
    public static TestDataFileName = (key: string): string => {
        return `${key}_test_case.xlsx`;
    };

    // The DataSources holding the test cases of every client configured for
    // the current TEST_ENV - the ones globalSetup downloads. Throws when a
    // configured client has no DataSources entry, so the run stops before
    // any download or test starts.
    public static TestDataSources = (): DataSourceConfig[] => {
        const clientKeys = Object.keys(
            ConfigurationManager.config().Environments?.[ConfigurationManager.TestEnv()]?.Clients ?? {});

        return clientKeys.map((key) => {
            const name = ConfigurationManager.TestDataFileName(key);
            const dataSource = ConfigurationManager.getDataSource(name);
            if (!dataSource) {
                throw new Error(
                    `No DataSources entry named '${name}' for client '${key}' in tests/test.config.json.`);
            }
            return dataSource;
        });
    };

}
