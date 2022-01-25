import http from  'https';
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { message } from '../refactor/interface/message.interface';
import { EmojiFilter } from './filter.message.for.emoji.service';
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@autoInjectable()
export class TelegramMessageServiceFunctionalities implements getMessageFunctionalities{

    constructor(private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat(message) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(message.text);
        const returnMessage = this.inputMessageFormat(message);
        returnMessage.messageBody = emojiFilteredMessage;
        return returnMessage;
    }

    async voiceMessageFormat(message) {
        let response: any = {};
        response = await this.GetTelegramMedia(message.voice.file_id);
        console.log("response of telegram media is", response);
        const file_path = response.result.file_path;
        if (file_path) {
            const ConvertedToText = await this.speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + response.result.file_path, "telegram");
            console.log("Converted to text",ConvertedToText);
            if (ConvertedToText) {
                const returnMessage = this.inputMessageFormat(message);
                returnMessage.messageBody = String(ConvertedToText);
                returnMessage.type = 'voice';
                return returnMessage;
            } else {
                throw new Error("Unable to convert the audio file to text");
            }
        } else {
            throw new Error("Unable to find the audio file path");
        }
    }

    async locationMessageFormat(message) {
        const location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
        const returnMessage = this.inputMessageFormat(message);
        returnMessage.type = 'location';
        returnMessage.latlong = location_message;
        returnMessage.messageBody = location_message;
        return returnMessage;
    }

    async imageMessaegFormat(message) {
        let response: any = {};
        response = await this.GetTelegramMedia(message.photo[3].file_id);
        console.log("response image get telegram", response);
        if (response.result.file_path){
            const returnMessage = this.inputMessageFormat(message);
            returnMessage.type = 'image';
            returnMessage.messageBody = response.result.file_path;
            return returnMessage;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    inputMessageFormat (message){
        console.log("the message", message);
        const response_message: message = {
            name            : message.from.first_name,
            platform        : "Telegram",
            chat_message_id : message.message_id,
            direction       : "In",
            messageBody     : null,
            sessionId       : message.chat.id.toString(),
            replayPath      : null,
            latlong         : null,
            type            : "text"
        };
        return response_message;
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

}
