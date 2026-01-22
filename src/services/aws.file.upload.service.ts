import AWS from 'aws-sdk';
import fs from 'fs';

// import nodeHtmlToImage from 'node-html-to-image';
import path from 'path';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SignedUrls } from './signed.urls.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { Helper } from '../common/helper';
import * as csv from 'fast-csv';

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

    async uploadKoboData(key,fileContent, datastructure = null)
    {
        try {
            console.log("function is called ");
            const responseCredentials: any = await this.getCrossAccountCredentials();
            var BUCKET_NAME = process.env.BUCKET_NAME;
            if (this.clientEnvironment.getClientEnvironmentVariable("S3_BUCKET_NAME")) {
                var BUCKET_NAME = this.clientEnvironment.getClientEnvironmentVariable("S3_BUCKET_NAME");
            }
            const params = {
                Bucket : BUCKET_NAME,
                Key    : key,// File name you want to save as in S3
            };
            const s3 = new AWS.S3(responseCredentials);
            const s3File = await s3.getObject(params).promise();
            const csvContent = s3File.Body.toString(); // File content as string
            const fieldNames: string[] = Object.keys(datastructure);
            let newRow: string[] = fieldNames.map((fieldName) => {
                const value = fileContent[fieldName];

                // Check if the key requires date formatting
                if (value && (fieldName === 'start' || fieldName === 'end' || fieldName === '_submission_time')) {
                    const date = new Date(value);
                    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                }
                return value || ''; // Return original value or empty string
            });
            const rows = [];
            await new Promise((resolve, reject) => {
                csv.parseString(csvContent, { headers: false })
                    .on('data', (row) => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            // Utility function to convert a string to title case
            const toTitleCase = (str: string): string => {
                return str
                    .toLowerCase()
                    .split(' ') // Split by spaces
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
                    .join(' '); // Join the words back
            };
            
            // Convert newRow values to title case
            newRow = newRow.map(toTitleCase);
        
            rows.push(newRow);

            // Step 3: Convert updated rows back to CSV format
            let updatedCsvContent = '';
            await new Promise((resolve, reject) => {
                const csvStream = csv.format({ headers: false });
                csvStream
                    .on('data', (chunk) => {
                        updatedCsvContent += chunk.toString();
                    })
                    .on('end', resolve)
                    .on('error', reject);

                rows.forEach((row) => csvStream.write(row));
                csvStream.end();
            });

            // Step 4: Upload the updated file back to S3
            const uploadParams = {
                Bucket      : BUCKET_NAME,
                Key         : key, // Overwrite the existing file
                Body        : updatedCsvContent,
                ContentType : 'text/csv',
            };
            await s3.upload(uploadParams, function(err){
                console.log(err);
            });
        }
        catch (error){
            console.log(error);
        }

    }

    async uploadFile (filePath, bucket_name : string = process.env.BUCKET_NAME,
        cloudFrontPath : string = process.env.CLOUD_FRONT_PATH,newFilename = null) {
        const fileLocation = await this.uploadFileToS3(filePath,bucket_name,cloudFrontPath,newFilename);
        return fileLocation;
    }

    readFileAndReturnAwsUploadParams =  (filePath, cloudFrontPathSplit, BucketName,newFilename = null) => {
        const fileContent = fs.readFileSync(filePath);
        if (newFilename === null)
        {
            var filename = filePath.replace(/^.*[\\/]/, '');
            this.fileName = filename;
            
        }
        else {
            this.fileName = newFilename;
        }
        console.log(this.fileName);

        const extension = path.parse(this.fileName).ext;

        // Setting up S3 upload parameters
        const params = {
            Bucket      : BucketName,
            Key         : cloudFrontPathSplit[3] + '/' + this.fileName , // File name you want to save as in S3
            Body        : fileContent,
            ContentType : Helper.getMimeType(extension),
        };
        this.params = params;
        
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
        cloudFrontPath : string = process.env.CLOUD_FRONT_PATH,newFilename = null) {

        console.log('File path is:' + filePath + ' Bucket Name is:' + bucket_name + ' Cloud front path name is' + cloudFrontPath);

        const responseCredentials: any = await this.getCrossAccountCredentials();
        const BucketName = bucket_name;
        const cloudFrontPathSplit = cloudFrontPath.split("/");
        const s3 = new AWS.S3(responseCredentials);
        try {
            this.readFileAndReturnAwsUploadParams(filePath, cloudFrontPathSplit, BucketName,newFilename);
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

    // METHOD BEING DEPRECATED DUE TO PACKAGE SUPPORT ISSUES
    // async createFileFromHTML (html) {
    //     const imageName = 'uploads/' + Date.now() + '.png';

    //     const REANLogo = fs.readFileSync('./uploads/ReanLogo.jpg');
    //     const COWINLogo = fs.readFileSync('./uploads/COWINLogo.jpeg');

    //     const base64REANLogo = new (Buffer as any).from(REANLogo).toString('base64');
    //     const base64COWINLogo = new (Buffer as any).from(COWINLogo).toString('base64');
    //     const dataURIREAN = 'data:image/jpeg;base64,' + base64REANLogo;
    //     const dataURICOWIN = 'data:image/jpeg;base64,' + base64COWINLogo;
    //     return new Promise<string>(async (resolve, reject) => {
    //         nodeHtmlToImage({
    //             output        : imageName,
    //             html          : html,
    //             content       : { imageSourceREAN: dataURIREAN, imageSourceCOWIN: dataURICOWIN },
    //             puppeteerArgs : { args: ['--no-sandbox'] }
    //         })
    //             .then(() => {
    //                 console.log('file created');
    //                 resolve(imageName);
    //             })
    //             .catch(async (error) => {
    //                 console.log('file creation error', error);
    //                 reject('');
    //             });
    //     });
    // }

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
