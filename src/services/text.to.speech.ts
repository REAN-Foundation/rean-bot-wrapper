/* eslint-disable lines-around-comment */
import textToSpeech from '@google-cloud/text-to-speech';
import * as protos from "@google-cloud/text-to-speech/build/protos/protos.js";
import util from 'util';
import fs from 'fs';
import crypto from 'crypto';
import { AwsS3manager } from './aws.file.upload.service.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ChatSession } from '../models/chat.session.js';
import { EntityManagerProvider } from './entity.manager.provider.service.js';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';

@scoped(Lifecycle.ContainerScoped)
export class GoogleTextToSpeech {

    constructor(
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService)private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {}

    async texttoSpeech(text, id) {
        return new Promise<string>(async (resolve) => {
            console.log("test for google text to speech", text);
            const mediaPath = await this.callGoogleTextToSpeech(text, id);
            console.log("mediaPath", mediaPath);
            const location = await this.awsS3manager.uploadFile(mediaPath);
            resolve(location);
        });
    }

    // For saving the auido in S3 bucket
    async callGoogleTextToSpeech(text, id) {
        return new Promise<string>(async (resolve) => {
            const GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
            const gcp = {
                credentials : GCPCredentials,
                projectId   : GCPCredentials.project_id
            };
            const client = new textToSpeech.TextToSpeechClient(gcp);
            // eslint-disable-next-line max-len
            const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
            const userLanguageTableResponse = await chatSessionRepository.findAll({ where: { userPlatformID: id } });
            const setUserLanguage = userLanguageTableResponse[userLanguageTableResponse.length - 1].preferredLanguage;

            // Construct the request
            const input = {
                input : {
                    text : text
                },
                // Select the language and SSML Voice Gender (optional)
                voice : {
                    languageCode : `${setUserLanguage}-IN`,
                    ssmlGender   : protos.google.cloud.texttospeech.v1.SsmlVoiceGender.NEUTRAL,
                },
                // Select the type of audio encoding
                audioConfig : {
                    audioEncoding : protos.google.cloud.texttospeech.v1.AudioEncoding.MP3
                },
            };
            try {
                const randomString = crypto.randomBytes(16).toString('hex');
                const filename = './audio/' + randomString + '.mp3';
                console.log("filename", filename);
                // Performs the text-to-speech request
                const [response] = await client.synthesizeSpeech(input);
                const writeFile = util.promisify(fs.writeFile);
                await writeFile(filename, response.audioContent, 'binary');
                console.log('Audio content written to file: ');
                resolve(filename);
            }
            catch (err) {
                console.log("failed to convert text to speech", err);
            }

        });
    }

}
