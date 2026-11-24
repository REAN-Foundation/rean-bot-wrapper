import { ConfigurationManager } from '../../config/configuration.manager';
import { FileStorageProvider } from '../../config/configuration.types';
import { IFileStorageService } from './interfaces/file.storage.service.interface';
import { AWSS3FileStorageService } from './providers/aws.s3.file.storage.service';
import { LocalFileStorageService } from './providers/local.file.storage.service';

/////////////////////////////////////////////////////////////////////////////

export class FileStorageFactory {

    public static create = (provider?: FileStorageProvider): IFileStorageService => {
        const resolved = provider ?? ConfigurationManager.FileStorageProvider();
        if (resolved === 'AWS-S3') {
            return new AWSS3FileStorageService();
        }
        return new LocalFileStorageService();
    };

}
