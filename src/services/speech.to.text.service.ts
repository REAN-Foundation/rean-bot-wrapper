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
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService) { }

    private GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    private awsCred = this.awss3manager;

    private env = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ENVIRONMENT");

    private obj_gcp = {
        credentials : this.GCPCredentials,
        projectId   : this.GCPCredentials.project_id
    };

    async SendSpeechRequest(fileUrl, chatServiceName, preferredLanguage) {
        return new Promise(async (resolve, reject) => {
            const obj = this.obj_gcp;
            if (chatServiceName === 'telegram') {
                http.get(fileUrl, async (res) => {
                    
                    //add time stamp - pending
                    const filename = path.basename(fileUrl);

                    // Audio file will be stored at this path
                    const uploadpath = `./audio/` + filename;

                    const filePath = fs.createWriteStream(uploadpath);
                    res.pipe(filePath);

                    const awsFile = await this.awss3manager.uploadFile(uploadpath);
                    main(awsFile, obj,this.awsCred,this.env, preferredLanguage).catch(console.error);
                });
            } else if (chatServiceName === 'whatsapp') {
                const awsFile = await this.awss3manager.uploadFile(fileUrl);
                main(awsFile, obj,this.awsCred,this.env, preferredLanguage).catch(console.error);
            }

            async function main(uploadpath, obj, awscred,env, preferredLanguage) {
                try {
                    const environment = {
                        'DEVELOPMENT' : 'dev',
                        'UAT'         : 'uat',
                        'PROD'        : 'prod'
                    };

                    const client = new speech.SpeechClient(obj);

                    const key = environment[env] + '/' + uploadpath.split('/')[4];

                    const awsGetFile = await awscred.getFile(key);
                    const audioBytes = awsGetFile.Body.toString('base64');
                    
                    console.log("upload Path,", uploadpath);

                    const audio = {
                        content : audioBytes,
                    };

                    const config = {
                        encoding                            : "OGG_OPUS",
                        sampleRateHertz                     : 16000,
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
                    resolve(transcription);
                } catch (error) {
                    reject(error);
                }
            }
        });
    }

}
