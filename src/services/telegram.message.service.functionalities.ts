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
import { SequelizeClient } from '../connection/sequelizeClient';
import path from 'path';
import fs from 'fs';

@autoInjectable()
export class TelegramMessageServiceFunctionalities implements getMessageFunctionalities{

    constructor(private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext,
        private awsS3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat(message) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(message.text);
        const returnMessage = this.inputMessageFormat(message);
        returnMessage.messageBody = message.text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            returnMessage.intent = "NegativeFeedback";
        }
        return returnMessage;
    }

    async voiceMessageFormat(message) {
        let response: any = {};
        response = await this.GetTelegramMedia(message.voice.file_id);
        console.log("response of telegram media is", response);
        const file_path = response.result.file_path;

        // await new SequelizeClient().connect();
        const preferredLanguage = await new UserLanguage().getPreferredLanguageofSession(message.from.id);
        if (preferredLanguage !== "null"){
            if (file_path) {
                const ConvertedToText = await this.speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "telegram", preferredLanguage);
                console.log("Converted to text!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",ConvertedToText);
                if (ConvertedToText) {
                    const returnMessage = this.inputMessageFormat(message);
                    returnMessage.messageBody = String(ConvertedToText);
                    returnMessage.type = 'voice';
                    return returnMessage;
                } else {
                    const returnMessage = this.inputMessageFormat(message);
                    returnMessage.messageBody = " ";
                    returnMessage.type = 'text';
                    return returnMessage;
                }
            } else {
                throw new Error("Unable to find the audio file path");
            }
        }
        else {
            const returnMessage = this.inputMessageFormat(message);
            returnMessage.messageBody = "Need to set language";
            returnMessage.type = 'text';
            return returnMessage;
        }
    }

    async locationMessageFormat(message) {
        const location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
        const returnMessage = this.inputMessageFormat(message);
        returnMessage.type = 'location';
        returnMessage.latlong = message.location;
        returnMessage.messageBody = location_message;
        return returnMessage;
    }

    async imageMessaegFormat(message) {
        let response: any = {};
        response = await this.GetTelegramMedia(message.photo[(message.photo).length - 1].file_id);
        console.log("response image get telegram", response);
        if (response.result.file_path){
            const filePath = await this.downloadTelegramMedia('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "photo");
            const location = await this.awsS3manager.uploadFile(filePath);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const url = require('url');
            const urlParse = url.parse(location);
            const imageUrl = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
            const returnMessage = this.inputMessageFormat(message);

            // console.log("location image in S3", imageUrl);
            returnMessage.type = 'image';
            returnMessage.messageBody = imageUrl;
            returnMessage.imageUrl = location;
            console.log("return message", returnMessage);
            return returnMessage;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    inputMessageFormat (message){
        //console.log("the message", message);
        const response_message: Imessage = {
            name                      : message.from.first_name,
            platform                  : "Telegram",
            chat_message_id           : message.message_id,
            direction                 : "In",
            messageBody               : null,
            imageUrl                  : null,
            sessionId                 : message.chat.id.toString(),
            replyPath                 : null,
            latlong                   : null,
            type                      : "text",
            intent                    : null,
            whatsappResponseMessageId : null,
            contextId                 : message.reply_to_message ? message.reply_to_message.message_id : null,
            telegramResponseMessageId : null
        };
        return response_message;
    }

    async documentMessageFormat(message) {
        let response: any = {};
        response = await this.GetTelegramMedia(message.document.file_id);
        console.log("response document get telegram", response);
        if (response.result.file_path){
            console.log("We are fetching the excel file here");
            const filePath = await this.downloadTelegramDocument('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "document");
            const location = filePath;
            const returnMessage = this.inputMessageFormat(message);
            returnMessage.type = 'document';
            returnMessage.messageBody = location.toString();
            return returnMessage;
        }
    }

    GetTelegramMedia = async (fileid) => {

        return new Promise((resolve, reject) => {
            const telgramMediaPath = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_MEDIA_PATH_URL");
            
            // console.log("afgshhhhhhhhhhhhh", (telgramMediaPath + '?file_id=' + fileid));
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
                console.log("filename", filename);
    
                // Audio file will be stored at this path
                const uploadpath = `./${media}/` + filename;
                console.log("uploadpath", uploadpath);
    
                const filePath = fs.createWriteStream(uploadpath);
                res.pipe(filePath);
    
                // const awsFile = await this.awss3manager.uploadFile(uploadpath);
                resolve(uploadpath);
            });
        });
    }

    async downloadTelegramDocument(url,media) {
        console.log(media);
        console.log("this is the media");
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
