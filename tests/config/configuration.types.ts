export type FileStorageProvider = 'AWS-S3' | 'Local';
export type DataFormat = 'CSV' | 'JSON' | 'XLSX';
export type ReportRetentionPolicy = 'Daily' | 'OnlyLatest';
export type EvaluationMethod = 'SemanticSimilarity';

///////////////////////////////////////////////////////////////////////////////////////////

export interface FileStorageConfig {
    Provider: FileStorageProvider;
}

export interface TemporaryFoldersConfig {
    Download  : string;
    HtmlReport: string;
    Reports   : string;
}

export interface SimilarityConfig {
    Threshold: number;
    Model    : string;
}

export interface EvaluationConfig {
    Method: EvaluationMethod;
}

export interface ReportsConfig {
    Provider: FileStorageProvider;
    Location: string;
}

export interface ReportRetentionConfig {
    Policy       : ReportRetentionPolicy;
    RetentionDays: number;
}

export interface EnvironmentConfig {
    Clients: Record<string, string>;
}

export interface DataSourceConfig {
    Name      : string;
    Provider  : FileStorageProvider;
    StorageKey: string;
    Format    : DataFormat;
}

export interface TestConfigurations {
    FileStorage      : FileStorageConfig;
    TemporaryFolders?: TemporaryFoldersConfig;
    Similarity       : SimilarityConfig;
    Evaluation       : EvaluationConfig;
    Reports          : ReportsConfig;
    ReportRetention  : ReportRetentionConfig;
    Environments     : Record<string, EnvironmentConfig>;
    DataSources      : DataSourceConfig[];
}
