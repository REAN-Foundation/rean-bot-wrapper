import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationManager } from '../../config/configuration.manager';
import { FileStorageProvider } from '../../config/configuration.types';
import { FileStorageFactory } from './file.storage.factory';

//////////////////////////////////////////////////////////////////////////////

export type FileUpload = {
    localFilePath : string;
    storageKey    : string;
};

const listFiles = (folder: string): string[] =>
    fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(folder, entry.name);
        return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
    });

export class StorageService {

    public static toKey = (...parts: string[]): string =>
        parts
            .map((part, i) => part.replace(/\\/g, '/').replace(i === 0 ? /\/+$/ : /^\/+|\/+$/g, ''))
            .filter(Boolean)
            .join('/');

    public static downloadAll = async (): Promise<void> => {
        const dataSources = ConfigurationManager.TestDataSources();
        const destinationFolder = ConfigurationManager.DownloadTemporaryFolder();

        for (const dataSource of dataSources) {
            const localFilePath = path.join(destinationFolder, dataSource.Name);

            await fs.promises.rm(localFilePath, { force: true });

            console.log(`[sequence] StorageService: downloading '${dataSource.Name}' (${dataSource.Provider}) -> ${localFilePath}`);
            await FileStorageFactory.create(dataSource.Provider).download(dataSource.StorageKey, localFilePath);
        }
    };

    public static uploadAll = async (uploads: FileUpload[], provider?: FileStorageProvider): Promise<void> => {
        const storage = FileStorageFactory.create(provider);
        for (const { localFilePath, storageKey } of uploads) {
            await storage.upload(localFilePath, storageKey);
        }
    };

    public static folderUploads = (localFolder: string, storageKey: string): FileUpload[] => {
        if (!fs.existsSync(localFolder)) {
            return [];
        }
        return listFiles(localFolder).map((filePath) => ({
            localFilePath : filePath,
            storageKey    : StorageService.toKey(storageKey, path.relative(localFolder, filePath)),
        }));
    };

}
