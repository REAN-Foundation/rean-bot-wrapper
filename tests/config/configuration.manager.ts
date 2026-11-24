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
        if (ConfigurationManager.EvaluationMethod() === 'LLM') {
            ConfigurationManager.LlmApiKey();
        }
        ConfigurationManager.ReportsLocation();
        ConfigurationManager.DownloadTemporaryFolder();
        ConfigurationManager.HtmlReportTemporaryFolder();
        ConfigurationManager.ReportsTemporaryFolder();
        ConfigurationManager.TestDataSources();
    };

    public static TestEnv = (): string => {
        return requiredEnv('TEST_ENV');
    };


    public static BaseUrl = (): string => {
        return requiredEnv('TEST_BASE_URL').replace(/\/*$/, '/');
    };

    public static ApiKey = (): string => {
        return requiredEnv('TEST_API_KEY');
    };

    public static PlatformId = (): string => {
        return requiredEnv('TEST_PLATFORM_ID');
    };

    public static ClientKeys = (): string[] => {
        return Object.keys(ConfigurationManager.config().Environments?.[ConfigurationManager.TestEnv()]?.Clients ?? {});
    };


    public static ClientName = (key: string): string | undefined => {
        return ConfigurationManager.config().Environments?.[ConfigurationManager.TestEnv()]?.Clients?.[key];
    };

    public static ClientPlatformId = (key: string): string => {
        const base = ConfigurationManager.PlatformId();
        const index = Math.max(0, ConfigurationManager.ClientKeys().indexOf(key));
        return /^\d+$/.test(base)
            ? (BigInt(base) + BigInt(index)).toString()
            : `${base}-${index}`;
    };

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

    public static LlmModel = (): string => {
        return ConfigurationManager.config().LLM?.Model || 'gpt-5-mini';
    };

    public static LlmApiKey = (): string => {
        return requiredEnv('OPENAI_API_KEY');
    };

    public static FileStorageProvider = (): FileStorageProvider | undefined => {
        return ConfigurationManager.config().FileStorage.Provider;
    };

    private static temporaryFolder = (name: keyof TemporaryFoldersConfig): string => {
        const location = ConfigurationManager.config().TemporaryFolders?.[name]?.trim();
        if (!location) {
            throw new Error(`TemporaryFolders.${name} is not configured.`);
        }
        return path.join(Helper.rootDir(), location);
    };

    public static DownloadTemporaryFolder = (): string => {
        return ConfigurationManager.temporaryFolder('Download');
    };

    public static HtmlReportTemporaryFolder = (): string => {
        return ConfigurationManager.temporaryFolder('HtmlReport');
    };

    public static ReportsTemporaryFolder = (): string => {
        return ConfigurationManager.temporaryFolder('Reports');
    };

    public static ReportsProvider = (): FileStorageProvider | undefined => {
        return ConfigurationManager.config().Reports?.Provider;
    };

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

    public static TestDataFileName = (key: string): string => {
        return `${key}_test_case.xlsx`;
    };

    public static TestDataSources = (): DataSourceConfig[] => {
        return ConfigurationManager.ClientKeys().map((key) => {
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
