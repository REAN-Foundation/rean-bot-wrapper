import * as fs from 'fs';
import * as path from 'path';
import { Helper } from '../../../common/helper';
import { IFileStorageService } from '../interfaces/file.storage.service.interface';

//////////////////////////////////////////////////////////////////////////////

const resolvePath = (storageKey: string) =>
    path.isAbsolute(storageKey) ? storageKey : path.join(Helper.rootDir(), storageKey);

export class LocalFileStorageService implements IFileStorageService {

    download = async (storageKey: string, localFilePath: string): Promise<string> => {
        await fs.promises.mkdir(path.dirname(localFilePath), { recursive: true });
        await fs.promises.copyFile(resolvePath(storageKey), localFilePath);

        return localFilePath;
    };

    upload = async (localFilePath: string, storageKey: string): Promise<string> => {
        const destinationPath = resolvePath(storageKey);

        await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.promises.copyFile(localFilePath, destinationPath);

        return destinationPath;
    };

}
