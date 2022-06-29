import AWS from 'aws-sdk';
import fs from 'fs';
import nodeHtmlToImage from 'node-html-to-image';
import { SignedUrls } from './signed.urls.service';

// import { TempCredentials } from './get.temporary.aws.credentials';

export class AwsS3manager{

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

    async uploadFile (filePath) {
        const responseCredentials: any = await this.getCrossAccountCredentials();
        const BUCKET_NAME = process.env.BUCKET_NAME;
        const cloudFrontPath = process.env.CLOUD_FRONT_PATH;
        const cloudFrontPathSplit = cloudFrontPath.split("/");

        console.log('FILE UPLOAD STARTING', BUCKET_NAME);
        return new Promise<string>(async (resolve, reject) => {

            // Read content from the file
            fs.stat(filePath, function (err) {
                if (err === null) {
                    console.log('File exists');
                    const fileContent = fs.readFileSync(filePath);
                    var filename = filePath.replace(/^.*[\\/]/, '');
                    var split_fs = filePath.split('/')[1];
                    console.log("filename", filename + split_fs);

                    // Setting up S3 upload parameters
                    const params = {
                        Bucket        : BUCKET_NAME,
                        Key           : cloudFrontPathSplit[3] + '/' + filename , // File name you want to save as in S3
                        Body          : fileContent,
                        'ContentType' : 'image/jpeg'
                    };

                    if (split_fs === 'audio'){
                        console.log("Detected as an Audio file");
                        params.ContentType = 'audio/ogg';
                    }

                    console.log("params");

                    // eslint-disable-next-line max-len
                    const s3 = new AWS.S3(responseCredentials);

                    // Uploading files to the bucket
                    s3.upload(params, async function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        console.log(`File uploaded successfully. ${data}`);

                        const location = process.env.CLOUD_FRONT_PATH + filename;
                        
                        resolve(await new SignedUrls().getSignedUrl(location));
                    });
                } else if (err.code === 'ENOENT') {

                    console.log('File not exists');
                    reject('File not exists');
                } else {
                    console.log('Some other error: ', err.code);
                    reject(err.code);
                }
            });

        });
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
        const responseCredentials: any = await this.getCrossAccountCredentials();
        const BUCKET_NAME = process.env.BUCKET_NAME;
        const s3 = new AWS.S3(responseCredentials);

        const downloadParams = {
            Key    : key,
            Bucket : BUCKET_NAME
        };

        const awsGetFile = await s3.getObject(downloadParams, function (error, data) {
            if (error) {
                console.error(error);
            }
            
            return data;
        }).promise();

        return awsGetFile;

    }

}
