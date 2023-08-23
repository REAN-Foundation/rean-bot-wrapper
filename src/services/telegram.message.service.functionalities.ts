/* eslint-disable max-len */
import http from  'https';
import http_tp from 'http';
import needle from 'needle';
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { Imessage } from '../refactor/interface/message.interface';
import { EmojiFilter } from './filter.message.for.emoji.service';
import { Speechtotext } from './speech.to.text.service';
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { AwsS3manager } from "./aws.file.upload.service";
import { UserLanguage } from './set.language';
import path from 'path';
import fs from 'fs';
import { Message } from './request.format/telegram.message.format';
import axios from 'axios';
import * as url from 'url';

@scoped(Lifecycle.ContainerScoped)
export class TelegramMessageServiceFunctionalities implements getMessageFunctionalities{

    constructor(@inject(EmojiFilter) private emojiFilter?: EmojiFilter,
        @inject(Speechtotext ) private speechtotext?: Speechtotext,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(UserLanguage) private userLanguage?: UserLanguage,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat(messageObj: Message) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getText());
        const messageToDialogflow = this.inputMessageFormat(messageObj);
        messageToDialogflow.messageBody = messageObj.getText();
        if (emojiFilteredMessage === "NegativeFeedback"){
            messageToDialogflow.intent = "NegativeFeedback";
        }
        return messageToDialogflow;
    }

    async voiceMessageFormat(messageObj: Message) {
        let response: any = {};
        response = await this.GetTelegramMedia(messageObj.getVoiceFileId());
        const file_path = response.result.file_path;

        // await new SequelizeClient().connect();
        const preferredLanguage = await this.userLanguage.getPreferredLanguageofSession(messageObj.getUserId());
        if (preferredLanguage !== "null"){
            if (file_path) {
                const ConvertedToText = await this.speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "telegram", preferredLanguage);
                if (ConvertedToText) {
                    const messagetoDialogflow = this.inputMessageFormat(messageObj);
                    messagetoDialogflow.messageBody = String(ConvertedToText);
                    messagetoDialogflow.type = 'voice';
                    return messagetoDialogflow;
                } else {
                    const messagetoDialogflow = this.inputMessageFormat(messageObj);
                    messagetoDialogflow.messageBody = " ";
                    messagetoDialogflow.type = 'text';
                    return messagetoDialogflow;
                }
            } else {
                throw new Error("Unable to find the audio file path");
            }
        }
        else {
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.messageBody = "Need to set language";
            messagetoDialogflow.type = 'text';
            return messagetoDialogflow;
        }
    }

    async locationMessageFormat(messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const location_message = `latlong:${messageObj.getLocation().latitude}-${messageObj.getLocation().longitude}`;
        messagetoDialogflow.type = 'location';
        messagetoDialogflow.latlong = messageObj.getLocation();
        messagetoDialogflow.messageBody = location_message;
        return messagetoDialogflow;
    }

    async photoMessageFormat(messageObj: Message) {
        try {
            const photoFileId = messageObj.getPhotoFileId();
            const telegramMediaData = await this.GetTelegramMedia(photoFileId);

            const filePath = await this.downloadTelegramMedia(
                `https://api.telegram.org/file/bot${this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN")}/${telegramMediaData.result.file_path}`,
                "photo"
            );
            const location = await this.awsS3manager.uploadFile(filePath);
    
            const urlParse = url.parse(location);
            const imageUrl = `${urlParse.protocol}//${urlParse.hostname}${urlParse.pathname}`;
    
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.type = 'image';
            messagetoDialogflow.messageBody = imageUrl;
            messagetoDialogflow.imageUrl = location;
    
            return messagetoDialogflow;
        } catch (error) {
            console.error('Error processing photo message:', error.message);
            throw error;
        }
    }

    inputMessageFormat (messageObj: Message){
        const messagetoDialogflow: Imessage = {
            name              : messageObj.getUsername(),
            platform          : "Telegram",
            chat_message_id   : messageObj.getChatId(),
            direction         : "In",
            messageBody       : null,
            imageUrl          : null,
            platformId        : messageObj.getUserId(),
            replyPath         : null,
            latlong           : null,
            type              : "text",
            intent            : null,
            responseMessageID : null,
            contextId         : messageObj.getContextId(),
        };
        return messagetoDialogflow;
    }

    async documentMessageFormat(messageObj: Message) {
        let response: any = {};
        response = await this.GetTelegramMedia(messageObj.getdocumentFileId());
        if (response.result.file_path){
            const filePath = await this.downloadTelegramDocument('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "document");
            const location = filePath;
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.type = 'document';
            messagetoDialogflow.messageBody = location.toString();
            return messagetoDialogflow;
        }
    }

    GetTelegramMedia = async (fileid: string): Promise<any> => {
        const telegramMediaPath = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_MEDIA_PATH_URL");

        const options = {
            headers : {

            },
        };
        const response = await needle('get', telegramMediaPath + '?file_id=' + fileid, options);
        console.log("data GetTelegramMedia", response.body);
        return response.body;
    }

    async  downloadTelegramMedia(fileUrl: string, media: string): Promise<string> {
        
        try {
            const response = await axios.get(fileUrl, { responseType: 'stream' });
    
            if (response.status !== 200) {
                throw new Error(`Failed to download media. Status code: ${response.status}`);
            }
    
            const filename = path.basename(fileUrl);
            const uploadpath = `./${media}/` + filename;
            const filePath = fs.createWriteStream(uploadpath);
    
            response.data.pipe(filePath);
    
            await new Promise<void>((resolve, reject) => {
                filePath.on('finish', () => resolve());
                filePath.on('error', (error) => reject(error));
            });
    
            return uploadpath;
        } catch (error) {
            console.error('Error downloading media:', error.message);
            throw error;
        }
    }

    async downloadTelegramDocument(url,media) {
        const proto = !url.charAt(4).localeCompare('s') ? http : http_tp;
        const filename = path.basename(url);
        const filePath = `./${media}/` + filename;

        if (!fs.existsSync(`./${media}`)) {
            fs.mkdirSync(`./${media}`);
        }

        return new Promise((resolve,reject) => {
            const file = fs.createWriteStream(filePath);

            const request = proto.get(url, response => {
                if (response.statusCode !== 200) {
                    fs.unlink(filePath, () => {
                        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                    });
                    return;
                }

                response.pipe(file);
            });

            file.on('finish', () => resolve(filePath));

            request.on('error', err => {
                fs.unlink(filePath, () => reject(err));
            });

            request.on('error', err => {
                fs.unlink(filePath, () => reject(err));
            });

            request.end();
        });
    }

}
