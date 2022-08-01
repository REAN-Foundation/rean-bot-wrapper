/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-len */
import http from 'https';
import path from 'path';
import speech from '@google-cloud/speech';
import fs from 'fs';
import { AwsS3manager } from './aws.file.upload.service';
import { autoInjectable } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
@autoInjectable()
export class Speechtotext {

    constructor(
        private awss3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {
        this.GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        this.obj_gcp = {
            credentials : this.GCPCredentials,
            projectId   : this.GCPCredentials.project_id
        };
        this.env = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ENVIRONMENT");
    }

    private GCPCredentials;

    private env;

    private obj_gcp;

    async SendSpeechRequest(fileUrl, chatServiceName, preferredLanguage) {
        return new Promise(async (resolve, reject) => {
            if (chatServiceName === 'telegram') {
                http.get(fileUrl, async (res) => {
                    
                    //add time stamp - pending
                    const filename = path.basename(fileUrl);

                    // Audio file will be stored at this path
                    const uploadpath = `./audio/` + filename;

                    const filePath = fs.createWriteStream(uploadpath);
                    res.pipe(filePath);

                    const awsFile = await this.awss3manager.uploadFile(uploadpath);
                    resolve(await this.callGCPSpeech(awsFile,this.env, preferredLanguage));
                });
            } else if (chatServiceName === 'whatsapp') {
                const awsFile = await this.awss3manager.uploadFile(fileUrl);
                resolve(await this.callGCPSpeech(awsFile,this.env, preferredLanguage).catch(console.error));
            }
        });
    }

    async callGCPSpeech(uploadpath, env, preferredLanguage) {
        return new Promise(async(resolve,reject) =>{
            try {
                const gcpCred = this.obj_gcp;
                const client = new speech.SpeechClient(gcpCred);
                const url = require('url');
                const key = ((url.parse(uploadpath)).pathname).substring(1);

                const awsGetFile = await this.awss3manager.getFile(key);

                const audioBytes = awsGetFile.Body.toString('base64');

                const audio = {
                    content : audioBytes,
                };

                const config = {
                    encoding                            : "OGG_OPUS",
                    sampleRateHertz                     : 48000,
                    languageCode                        : preferredLanguage,
                    enableSeparateRecognitionPerChannel : true,
                };
                let request = {};
                request = {
                    audio  : audio,
                    config : config,
                };

                const [response] = await client.recognize(request);

                // console.log("response %O", response);
                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');
                console.log("transcription", transcription);
                resolve(transcription);
            } catch (error) {
                reject(error);
            }
        });
    }

}
