export interface IFileStorageService {

    download(storageKey: string, localFilePath: string): Promise<string>;
    
    upload(localFilePath: string, storageKey: string): Promise<string>;
}
