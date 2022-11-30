/* eslint-disable max-len */
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import http from  'https';
import fs from 'fs';
import { Imessage } from '../refactor/interface/message.interface';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';
import { AwsS3manager } from "./aws.file.upload.service";
import { UserLanguage } from "./set.language";
import needle from 'needle';

@autoInjectable()
export class MessageFunctionalities implements getMessageFunctionalities {

    constructor(private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext,
        private awsS3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat (msg, type) {
        let emojiFilteredMessage;
        const returnMessage = this.inputMessageFormat(msg);
        if (type === "reaction"){
            emojiFilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].reaction.emoji);
            returnMessage.type = 'reaction';
            returnMessage.messageBody = msg.messages[0].reaction.emoji;
            returnMessage.whatsappResponseMessageId = msg.messages[0].reaction.message_id;
        }
        else {
            emojiFilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].text.body);
            // returnMessage.payload.originalMessage = emojiFilteredMessage;
            returnMessage.messageBody = msg.messages[0].text.body;
        }
        // returnMessage.payload.originalMessage = emojiFilteredMessage;
        if (emojiFilteredMessage === "NegativeFeedback"){
            returnMessage.intent = "NegativeFeedback";
        }
        return returnMessage;
    }

    async locationMessageFormat (msg) {
        const loc = `latlong:${msg.messages[0].location.latitude}-${msg.messages[0].location.longitude}`;
        const returnMessage = this.inputMessageFormat(msg);
        returnMessage.type = 'location';
        returnMessage.latlong = msg.messages[0].location;
        returnMessage.messageBody = loc;
        return returnMessage;
    }

    async voiceMessageFormat (msg, type, chanel) {
        let mediaUrl;
        let preferredLanguageRequest;
        if (chanel === "whatsappMeta") {
            mediaUrl = await this.GetWhatsappMetaMedia('audio', msg.messages[0].url, '_voice.ogg');
            // mediaUrl = msg.messages[0].url;
            preferredLanguageRequest = msg.messages[0].from;
        } else {
            mediaUrl = await this.GetWhatsappMedia('audio', msg.messages[0][type].id, '_voice.ogg');
            preferredLanguageRequest = msg.messages[0].from;
        }

        const preferredLanguage = await new UserLanguage().getPreferredLanguageofSession(preferredLanguageRequest);
        const ConvertedToText = await this.speechtotext.SendSpeechRequest(mediaUrl, "whatsapp", preferredLanguage);
        if (preferredLanguage !== "null"){
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
        else {
            const returnMessage = this.inputMessageFormat(msg);
            returnMessage.messageBody = "Need to set language";
            returnMessage.type = 'text';
            return returnMessage;
        }
    }

    async imageMessaegFormat(msg) {
        let response: any = {};
        response = await this.GetWhatsappMedia('photo', msg.messages[0].image.id, '.jpg');
        console.log("response from GetWhatsappMedia", response);
        const location = await this.awsS3manager.uploadFile(response);
        console.log("response image whatsapp", location);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const url = require('url');
        const urlParse = url.parse(location);
        const imageUrl = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
        if (response){
            const returnMessage = this.inputMessageFormat(msg);
            returnMessage.type = 'image';
            returnMessage.messageBody = imageUrl;
            returnMessage.imageUrl = location;
            return returnMessage;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    async interactiveMessaegFormat(msg) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].interactive.button_reply.title);
        const returnMessage = this.inputMessageFormat(msg);
        returnMessage.messageBody = emojiFilteredMessage;
        returnMessage.intent = msg.messages[0].interactive.button_reply.id;
        return returnMessage;
    }

    async interactiveListMessaegFormat(msg){
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(msg.messages[0].interactive.list_reply.title);
        const returnMessage = this.inputMessageFormat(msg);
        returnMessage.messageBody = emojiFilteredMessage;
        returnMessage.intent = msg.messages[0].interactive.list_reply.id;
        return returnMessage;
    }

    async interactiveButtonMessaegFormat(msg){
        const message = msg.messages[0].interactive.button_reply.title;
        const returnMessage = this.inputMessageFormat(msg);
        returnMessage.messageBody = message;
        returnMessage.intent = msg.messages[0].interactive.button_reply.id;
        return returnMessage;
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

            if (type === 'photo'){
                const fileUrl = 'https://' + options.hostname + options.path;
                console.log("fileurl", fileUrl);
                http.get(fileUrl, options, async(res) => {
                    const uploadpath = `${type}/` + Date.now() + `${extension}`;
                    console.log("uploadpath", uploadpath);
                    const filePath = fs.createWriteStream(uploadpath);
                    res.pipe(filePath);
                    resolve(uploadpath);
                });
                
            }

            else {
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
            }
        });
    };

    GetWhatsappMetaMedia = async (type, mediaUrl, extension) => {
        return new Promise((resolve, reject) => {
            const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
            const headers = {
                headers : {
                    'Authorization' : `Bearer ${token}`,
                }
            };

            try { 
                const request = needle.get(mediaUrl, headers, function(err, resp, body) { 
                    if (err){
                        console.log('FAiled to REad File');
                    }
                    const file_name = `${type}/` + Date.now() + `${extension}`;
                    fs.writeFile('./' + file_name,body, err => { 
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            resolve(file_name);
                        }
                    } );
                });
            } catch (err) { 
                console.log(err);
            }
        });
    };

    inputMessageFormat (message){
        const response_message: Imessage = {
            name                      : message.contacts[0].profile.name,
            platform                  : "Whatsapp",
            chat_message_id           : message.messages[0].id,
            direction                 : "In",
            messageBody               : null,
            imageUrl                  : null,
            sessionId                 : message.contacts[0].wa_id,
            replyPath                 : null,
            latlong                   : null,
            type                      : "text",
            intent                    : null,
            whatsappResponseMessageId : null,
            contextId                 : message.messages[0].context ? message.messages[0].context.id : null,
            telegramResponseMessageId : null
        };
        return response_message;
    }

    sanitizeMessage = (message) => {
        if (message) {
            message = message.replace(/<b> /g, "*").replace(/<b>/g, "*")
                .replace(/ <\/b>/g, "* ")
                .replace(/ <\/ b>/g, "* ")
                .replace(/<\/b>/g, "* ");
            if (message.length > 4096) {

                var strshortened = message.slice(0, 3800);
                strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
                message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
            }
        }

        // console.log("msg  has been santised", message);
        return message;
    };

}
