import AWS from 'aws-sdk';
import fs from 'fs';
import nodeHtmlToImage from 'node-html-to-image';
import path from 'path';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SignedUrls } from './signed.urls.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class AwsS3manager{

    private params;

    private fileName;

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(SignedUrls) private signedUrls?: SignedUrls
    ) {}

    async getCrossAccountCredentials() {
        return new Promise((resolve, reject) => {
            const sts = new AWS.STS();
            const timestamp = (new Date()).getTime();
            const params = {
                RoleArn         : process.env.ROLE_ARN,
                RoleSessionName : `be-descriptibe-here-${timestamp}`
            };
            sts.assumeRole(params, (err, data) => {
                if (err) reject(err);
                else {
                    resolve({
                        accessKeyId     : data.Credentials.AccessKeyId,
                        secretAccessKey : data.Credentials.SecretAccessKey,
                        sessionToken    : data.Credentials.SessionToken,
                    });
                }
            });
        });
    }

    async uploadKoboData(key,fileContent)
    {
        try {
            console.log("function is called ");
            const responseCredentials: any = await this.getCrossAccountCredentials();
            var BUCKET_NAME = process.env.BUCKET_NAME;
            if (this.clientEnvironment.getClientEnvironmentVariable("S3_BUCKET_NAME")) {
                var BUCKET_NAME = this.clientEnvironment.getClientEnvironmentVariable("S3_BUCKET_NAME");
            }
            console.log("bucket_name is ",BUCKET_NAME);
            console.log("file path",key);
            console.log(fileContent);
            const params = {
                Bucket : BUCKET_NAME,
                Key    : key,// File name you want to save as in S3
                Body   : JSON.stringify(fileContent)
            };
            const s3 = new AWS.S3(responseCredentials);
            await s3.upload(params, function(err){
                console.log(err);
            });
        }
        catch (error){
            console.log(error);
        }

    }

    async uploadFile (filePath) {
        return new Promise<string>( async (resolve, reject) => { 
            const fileLocation = await this.uploadFileToS3(filePath);
            // const signedUrl = await this.signedUrls.getSignedUrl(fileLocation);
            resolve(fileLocation);
        });
    }

    readFileAndReturnAwsUploadParams =  (filePath, cloudFrontPathSplit, BucketName) => {
        const fileContent = fs.readFileSync(filePath);
        var filename = filePath.replace(/^.*[\\/]/, '');
        this.fileName = filename;
        const extension = path.parse(filename).ext;

        // Setting up S3 upload parameters
        const params = {
            Bucket        : BucketName,
            Key           : cloudFrontPathSplit[3] + '/' + filename , // File name you want to save as in S3
            Body          : fileContent,
            'ContentType' : 'image/jpeg'
        };
        if (extension === '.ogg' || extension === '.mp3' || extension === '.oga'){
            console.log("Detected as an Audio file");
            params.ContentType = 'audio/ogg';
            if (extension === ".mp3" ){
                params.ContentType = 'audio/mpeg';
                this.params = params;
            }
            this.params = params;
        } else {
            this.params = params;
        }

        // fs.stat(filePath, function (err) {
        //     try {
        //         if (err === null) {
        //             console.log('File exists');
        //             const fileContent = fs.readFileSync(filePath);
        //             var filename = filePath.replace(/^.*[\\/]/, '');
        //             this.fileName = filename;
        //             const extension = path.parse(filename).ext;
        
        //             // Setting up S3 upload parameters
        //             const params = {
        //                 Bucket        : BucketName,
        //                 Key           : cloudFrontPathSplit[3] + '/' + filename , // File name you want to save as in S3
        //                 Body          : fileContent,
        //                 'ContentType' : 'image/jpeg'
        //             };
            
        //             if (extension === '.ogg' || extension === '.mp3' || extension === '.oga'){
        //                 console.log("Detected as an Audio file");
        //                 params.ContentType = 'audio/ogg';
        //                 if (extension === ".mp3" ){
        //                     params.ContentType = 'audio/mpeg';
        //                     this.params = params;
        //                 }
        //                 this.params = params;
        //             }
        //             this.params = params;
        //         } else if (err.code === 'ENOENT') {
        //             console.log('File not exists');
        //         } else {
        //             console.log('Some other error: ', err.code);
        //         }
        //     }
        //     catch (error){
        //         console.log(error);
        //     }
                
        // });
        
    };

    async uploadFileToS3 (
        filePath, 
        bucket_name : string = process.env.BUCKET_NAME, 
        cloudFrontPath : string = process.env.CLOUD_FRONT_PATH) {

        console.log('File path is:' + filePath + ' Bucket Name is:' + bucket_name + ' Cloud front path name is' + cloudFrontPath);

        const responseCredentials: any = await this.getCrossAccountCredentials();
        const BucketName = bucket_name;
        const cloudFrontPathSplit = cloudFrontPath.split("/");
        const s3 = new AWS.S3(responseCredentials);
        try {
            this.readFileAndReturnAwsUploadParams(filePath, cloudFrontPathSplit, BucketName);
            await s3.upload(this.params, function (err) {
                if (err) {
                    console.log(err);
                }
            }).promise();
            const location = cloudFrontPath + this.fileName;
            if (BucketName != process.env.BUCKET_NAME){
                return location;
            } else {
                const signedUrl = await this.signedUrls.getSignedUrl(location);
                return signedUrl;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async createFileFromHTML (html) {
        const imageName = 'uploads/' + Date.now() + '.png';

        const REANLogo = fs.readFileSync('./uploads/ReanLogo.jpg');
        const COWINLogo = fs.readFileSync('./uploads/COWINLogo.jpeg');

        const base64REANLogo = new (Buffer as any).from(REANLogo).toString('base64');
        const base64COWINLogo = new (Buffer as any).from(COWINLogo).toString('base64');
        const dataURIREAN = 'data:image/jpeg;base64,' + base64REANLogo;
        const dataURICOWIN = 'data:image/jpeg;base64,' + base64COWINLogo;
        return new Promise<string>(async (resolve, reject) => {
            nodeHtmlToImage({
                output        : imageName,
                html          : html,
                content       : { imageSourceREAN: dataURIREAN, imageSourceCOWIN: dataURICOWIN },
                puppeteerArgs : { args: ['--no-sandbox'] }
            })
                .then(() => {
                    console.log('file created');
                    resolve(imageName);
                })
                .catch(async (error) => {
                    console.log('file creation error', error);
                    reject('');
                });
        });
    }

    async getFile (key) {
        return new Promise<any>(async(resolve) => {
            const responseCredentials: any = await this.getCrossAccountCredentials();
            var BUCKET_NAME = process.env.BUCKET_NAME;
            if (this.clientEnvironment.getClientEnvironmentVariable("S3_BUCKET_NAME")) {
                var BUCKET_NAME = this.clientEnvironment.getClientEnvironmentVariable("S3_BUCKET_NAME");
            }
            console.log("DBCJNKJCLNDSKOSCHKLSDNCKLNSD",BUCKET_NAME);
            const s3 = new AWS.S3(responseCredentials);

            const downloadParams = {
                Key    : key,
                Bucket : BUCKET_NAME
            };

            s3.getObject(downloadParams, function (error, data) {
                if (error) {
                    console.error(error);
                }
                resolve(data);
            });
        });

    }
}
