import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import http from  'https';
import fs from 'fs';
import { message } from '../refactor/interface/message.interface';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';
import { AwsS3manager } from "./aws.file.upload.service";

@autoInjectable()
export class MessageFunctionalities implements getMessageFunctionalities {

    constructor(private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext,
        private awsS3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat (msg) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].text.body);
        const returnMessage = this.inputMessageFormat(msg);
        returnMessage.messageBody = emojiFilteredMessage;
        return returnMessage;
    }

    async locationMessageFormat (msg) {
        const loc = `latlong:${msg.messages[0].location.latitude}-${msg.messages[0].location.longitude}`;
        const returnMessage = this.inputMessageFormat(msg);
        returnMessage.type = 'location';
        returnMessage.latlong = loc;
        returnMessage.messageBody = loc;
        return returnMessage;
    }

    async voiceMessageFormat (msg) {
        const mediaUrl = await this.GetWhatsappMedia('audio', msg.messages[0].voice.id, '_voice.ogg');
        const ConvertedToText = await this.speechtotext.SendSpeechRequest(mediaUrl, "whatsapp");
        if (ConvertedToText) {
            const returnMessage = this.inputMessageFormat(msg);
            returnMessage.messageBody = String(ConvertedToText);
            returnMessage.type = 'voice';
            return returnMessage;
        }
        else {
            const returnMessage = this.inputMessageFormat(msg);
            returnMessage.messageBody = " ";
            returnMessage.type = 'text';
            return returnMessage;
        }
    }

    async imageMessaegFormat(msg) {
        let response: any = {};
        response = await this.GetWhatsappMedia('photo', msg.messages[0].image.id, '.jpg');
        console.log("response from GetWhatsappMedia", response);
        const location = await this.awsS3manager.uploadFile(response);
        console.log("response image whatsapp", response);
        if (response){
            const returnMessage = this.inputMessageFormat(msg);
            returnMessage.type = 'image';
            returnMessage.messageBody = location;
            return returnMessage;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    /*retrive whatsapp media */
    GetWhatsappMedia = async (type, mediaId, extension) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST"),
                path     : '/v1/media/' + mediaId,
                method   : 'GET',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY")
                }
            };

            const request = http.request(options, (response) => {
                response.on('data', (chunk) => {
                    const file_name = `${type}/` + Date.now() + `${extension}`;
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
    };

    inputMessageFormat (message){
        const response_message: message = {
            name            : message.contacts[0].profile.name,
            platform        : "Whatsapp",
            chat_message_id : message.messages[0].id,
            direction       : "In",
            messageBody     : null,
            sessionId       : message.contacts[0].wa_id,
            replyPath       : null,
            latlong         : null,
            type            : "text"
        };
        return response_message;
    }

}
