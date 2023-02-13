import http from  'https';
import http_tp from 'http';
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { Imessage } from '../refactor/interface/message.interface';
import { EmojiFilter } from './filter.message.for.emoji.service';
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { AwsS3manager } from "./aws.file.upload.service";
import { UserLanguage } from './set.language';
import path from 'path';
import fs from 'fs';
import { Message } from './request.format/telegram.message.format';

@autoInjectable()
export class TelegramMessageServiceFunctionalities implements getMessageFunctionalities{

    constructor(private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext,
        private awsS3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

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
        const preferredLanguage = await new UserLanguage().getPreferredLanguageofSession(messageObj.getUserId());
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
        let response: any = {};
        response = await this.GetTelegramMedia(messageObj.getPhotoFileId());
        if (response.result.file_path){
            const filePath = await this.downloadTelegramMedia('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "photo");
            const location = await this.awsS3manager.uploadFile(filePath);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const url = require('url');
            const urlParse = url.parse(location);
            const imageUrl = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.type = 'image';
            messagetoDialogflow.messageBody = imageUrl;
            messagetoDialogflow.imageUrl = location;
            return messagetoDialogflow;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    inputMessageFormat (messageObj: Message){
        const messagetoDialogflow: Imessage = {
            name                      : messageObj.getUsername(),
            platform                  : "Telegram",
            chat_message_id           : messageObj.getChatId(),
            direction                 : "In",
            messageBody               : null,
            imageUrl                  : null,
            platformId                : messageObj.getUserId(),
            replyPath                 : null,
            latlong                   : null,
            type                      : "text",
            intent                    : null,
            whatsappResponseMessageId : null,
            contextId                 : messageObj.getContextId(),
            telegramResponseMessageId : null
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

    GetTelegramMedia = async (fileid) => {

        return new Promise((resolve, reject) => {
            const telgramMediaPath = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_MEDIA_PATH_URL");
            const req = http.request(telgramMediaPath + '?file_id=' + fileid, res => {
                let data = " ";
                res.on('data', d => {
                    data += d;
                });
                res.on("end", () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', error => {
                reject(error);
            });
            req.end();
        });
    };

    async downloadTelegramMedia(fileUrl, media) {
        return new Promise<string>((resolve) => {
            http.get(fileUrl, async(res) => {
                    
                //add time stamp - pending
                const filename = path.basename(fileUrl);
    
                // Audio file will be stored at this path
                const uploadpath = `./${media}/` + filename;
    
                const filePath = fs.createWriteStream(uploadpath);
                res.pipe(filePath);
    
                // const awsFile = await this.awss3manager.uploadFile(uploadpath);
                resolve(uploadpath);
            });
        });
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
