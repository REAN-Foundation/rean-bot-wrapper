import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { IFileStorageService } from '../interfaces/file.storage.service.interface';

//////////////////////////////////////////////////////////////////////////////

const CONTENT_TYPES: Record<string, string> = {
    '.html' : 'text/html; charset=utf-8',
    '.js'   : 'application/javascript',
    '.css'  : 'text/css',
    '.json' : 'application/json',
    '.svg'  : 'image/svg+xml',
    '.png'  : 'image/png',
    '.jpg'  : 'image/jpeg',
    '.txt'  : 'text/plain; charset=utf-8',
    '.zip'  : 'application/zip',
    '.xlsx' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const splitStorageKey = (storageKey: string) => {
    const [bucket, ...keyParts] = storageKey.replace(/^\/+/, '').split('/');
    const key = keyParts.join('/');
    if (!bucket || !key) {
        throw new Error(`S3 storage key must be '<bucket>/<key>'. Got: '${storageKey}'`);
    }
    return { bucket, key };
};

export class AWSS3FileStorageService implements IFileStorageService {

    private _client = new S3Client({});

    download = async (storageKey: string, localFilePath: string): Promise<string> => {
        const { bucket, key } = splitStorageKey(storageKey);

        const response = await this._client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        if (!response.Body) {
            throw new Error(`S3 object s3://${bucket}/${key} has no content.`);
        }
        const stream = response.Body as Readable;

        await fs.promises.mkdir(path.dirname(localFilePath), { recursive: true });

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(localFilePath);
            stream
                .on('error', reject)
                .pipe(file)
                .on('finish', () => resolve(localFilePath))
                .on('error', reject);
        });
    };

    upload = async (localFilePath: string, storageKey: string): Promise<string> => {
        const { bucket, key } = splitStorageKey(storageKey);

        await this._client.send(new PutObjectCommand({
            Bucket      : bucket,
            Key         : key,
            Body        : await fs.promises.readFile(localFilePath),
            ContentType : CONTENT_TYPES[path.extname(localFilePath).toLowerCase()] ?? 'application/octet-stream',
        }));

        return `s3://${bucket}/${key}`;
    };

}
