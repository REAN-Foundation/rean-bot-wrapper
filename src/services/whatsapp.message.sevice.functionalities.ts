import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import http from  'https';
import fs from 'fs';
import { response, message } from '../refactor/interface/message.interface';
import { platformMessageService } from './whatsapp.message.service';
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable, delay, inject } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';


@autoInjectable()
export class MessageFunctionalities implements getMessageFunctionalities {

    constructor(@inject(delay(() => platformMessageService) ) public platformMessageService,
        private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext){}

    async textMessageFormat (msg) {
        let returnMessage: message;
        let emojiFilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].text.body);
        returnMessage = this.inputMessageFormat(msg);
        returnMessage.messageBody = emojiFilteredMessage;
        return returnMessage
    }

    async locationMessageFormat (msg) {
        let returnMessage: message;
        const loc = `latlong:${msg.messages[0].location.latitude}-${msg.messages[0].location.longitude}`;
        returnMessage = this.inputMessageFormat(msg);
        returnMessage.type = 'location';
        returnMessage.latlong = loc;
        returnMessage.messageBody = loc;
        return returnMessage
    }

    async voiceMessageFormat (msg) {
        let returnMessage: message;
        const mediaUrl = await this.GetWhatsappMedia(msg.messages[0].voice.id);
        const ConvertedToText = await this.speechtotext.SendSpeechRequest(mediaUrl, "whatsapp");
        if (ConvertedToText) {
            returnMessage = this.inputMessageFormat(msg);
            returnMessage.messageBody = String(ConvertedToText);
            returnMessage.type = 'voice';
        }
        else {
            throw new Error("Unable to convert the audio file to text");
        }
        return returnMessage
    }

    /*retrive whatsapp media */
    GetWhatsappMedia = async (mediaId) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname : process.env.WHATSAPP_LIVE_HOST,
                path     : '/v1/media/' + mediaId,
                method   : 'GET',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : process.env.WHATSAPP_LIVE_API_KEY
                }
            };

            const request = http.request(options, (response) => {
                response.on('data', (chunk) => {
                    const file_name = 'audio/' + Date.now() + '_voice.ogg';
                    fs.writeFile('./' + file_name, chunk, err => {
                        if (err) {
                            reject(err);
                            return;
                        } else {
                            resolve(file_name);
                        }
                    });
                });
            });

            request.on('error', (e) => {
                reject(e);
            });
            request.end();
        });
    }

    inputMessageFormat (message){
        const response_message: message = {
            name                : message.contacts[0].profile.name,
            platform            : "Whatsapp",
            chat_message_id     : message.messages[0].id,
            direction           : "In",
            messageBody         : null,
            sessionId           : message.contacts[0].wa_id,
            replayPath          : null,
            latlong             : null,
            type                : "text"
        };
        return response_message;
    }
    
}