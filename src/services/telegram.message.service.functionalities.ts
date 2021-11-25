import http from  'https';
import fs from 'fs';
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { response, message } from '../refactor/interface/message.interface';
import { EmojiFilter } from './filter.message.for.emoji.service';
import { platformMessageService } from "./telegram.message.service";
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable, delay, inject } from "tsyringe";

@autoInjectable()
export class TelegramMessageServiceFunctionalities implements getMessageFunctionalities{
    constructor(@inject(delay(() => platformMessageService) ) public platformMessageService,
    private emojiFilter?: EmojiFilter,
    private speechtotext?: Speechtotext){}

    async textMessageFormat(message) {
        let returnMessage: message;
        let emojiFilteredMessage = await this.emojiFilter.checkForEmoji(message.text);
        returnMessage = this.inputMessageFormat(message);
        returnMessage.messageBody = emojiFilteredMessage;
        return returnMessage
    }
    async voiceMessageFormat(message) {
        let response: any = {};
        let returnMessage: message;
        response = await this.GetTelegramMedia(message.voice.file_id);
        console.log("response of telegram media is", response);
        const file_path = response.result.file_path;
        if (file_path) {
            const ConvertedToText = await this.speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + process.env.TELEGRAM_BOT_TOKEN + '/' + response.result.file_path, "telegram");
            console.log("Converted to text",ConvertedToText)
            if (ConvertedToText) {
                returnMessage = this.inputMessageFormat(message);
                returnMessage.messageBody = String(ConvertedToText);
                returnMessage.type = 'voice';
            } else {
                throw new Error("Unable to convert the audio file to text");
            }
        } else {
            throw new Error("Unable to find the audio file path");
        }
        return returnMessage;
    }
    async locationMessageFormat(message) {
        let returnMessage: message;
        const location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
            // returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: location_message,type: 'location' };
        returnMessage = this.inputMessageFormat(message);
        returnMessage.type = 'location';
        returnMessage.latlong = location_message;
        returnMessage.messageBody = location_message;
        return returnMessage
    }

    inputMessageFormat (message){
        console.log("the message", message)
        const response_message: message = {
            name                : message.from.first_name,
            platform            : "Telegram",
            chat_message_id     : message.message_id,
            direction           : "In",
            messageBody         : null,
            sessionId           : message.chat.id.toString(),
            replayPath          : null,
            latlong             : null,
            type                : "text"
        };
        return response_message;
    }

    GetTelegramMedia = async (fileid) => {

        return new Promise((resolve, reject) => {
            console.log("afgshhhhhhhhhhhhh", process.env.TELEGRAM_MEDIA_PATH_URL + '?file_id=' + fileid);
            const req = http.request(process.env.TELEGRAM_MEDIA_PATH_URL + '?file_id=' + fileid, res => {
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