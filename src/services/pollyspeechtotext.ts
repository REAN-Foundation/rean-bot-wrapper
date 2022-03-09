
import AWS from 'aws-sdk';
import fs from 'fs';
import crypto from 'crypto';
import { AwsS3manager } from './aws.file.upload.service';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class AWSPolly {

    constructor(private awsS3manager?: AwsS3manager) {}

    async texttoSpeech(text) {
        return new Promise<string>(async (resolve, reject) => {
            const responseCredentials: any = await this.awsS3manager.getCrossAccountCredentials();
            const credObj = {
                region          : process.env.region,
                accessKeyId     : responseCredentials.accessKeyId,
                secretAccessKey : responseCredentials.secretAccessKey,
                sessionToken    : responseCredentials.sessionToken
            };

            const input = {
                Engine       : "neural",
                Text         : text,
                OutputFormat : "mp3",
                VoiceId      : "Joanna"
            };

            const mediaPath = await this.callPolly(credObj,input);
            const location = await this.awsS3manager.uploadFile(mediaPath);
            resolve(location);
        });
    }

    async callPolly(credObj, input) {
        return new Promise<any>(async (resolve, reject) => {
            try {
                const randomString = crypto.randomBytes(16).toString('hex');
                console.log(randomString);
                const Polly = new AWS.Polly(credObj);
                Polly.synthesizeSpeech(input, async(err, data) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    if (data.AudioStream instanceof Buffer) {
                        console.log("data", data);
                        const filename = './audio/' + randomString + '.mp3';
                        console.log("filename", filename);
                        fs.writeFile(filename, data.AudioStream, async(fsErr) => {
                            if (fsErr) {
                                console.error(fsErr);
                                return;
                            }
                            resolve(filename);
                            console.log('Success');
                        });
                    }
                });
                
            }
            catch (error) {
                console.log("polly catch err", error.message);
            }
        });
    }

    // For saving the auido in S3 bucket
    async texttoSpeechS3(text) {
        return new Promise<string>(async (resolve, reject) => {
            const responseCredentials: any = await this.awsS3manager.getCrossAccountCredentials();
            const credObj = {
                region          : process.env.region,
                accessKeyId     : responseCredentials.accessKeyId,
                secretAccessKey : responseCredentials.secretAccessKey,
                sessionToken    : responseCredentials.sessionToken
            };

            const input = {
                Engine             : "neural",
                Text               : text,
                OutputFormat       : "mp3",
                VoiceId            : "Joanna",
                OutputS3BucketName : process.env.BUCKET_NAME
            };
            const Polly = new AWS.Polly(credObj);
            try {
                Polly.startSpeechSynthesisTask(input, async (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    if (data) {
                        console.log("audio file uploaded", data);
                        const audioURL = data.SynthesisTask.OutputUri;
                        resolve(audioURL);
                    }
                });
            }
            catch (error) {
                console.log("polly catch err", error.message);
            }
        });
    }
}

