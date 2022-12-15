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
import { Message } from './request.format/whatsapp.message.format';
@autoInjectable()
export class MessageFunctionalities implements getMessageFunctionalities {

    constructor(private emojiFilter?: EmojiFilter,
        private speechtotext?: Speechtotext,
        private awsS3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        // const textObj = { messageBody: null, intent: null };
        const text = messageObj.getText();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(text);
        messagetoDialogflow.messageBody = text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        return messagetoDialogflow;
    }

    async reactMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const reaction = messageObj.getReaction();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(reaction.emoji);
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        messagetoDialogflow.messageBody = reaction.emoji;
        messagetoDialogflow.type = 'reaction';
        messagetoDialogflow.whatsappResponseMessageId = reaction.messageId;
        return messagetoDialogflow;
    }

    async locationMessageFormat (messageObj) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const loc = `latlong:${messageObj.getLocation().latitude}-${messageObj.getLocation().longitude}`;
        messagetoDialogflow.type = 'location';
        messagetoDialogflow.latlong = messageObj.getLocation();
        messagetoDialogflow.messageBody = loc;
        return messagetoDialogflow;
    }

    async voiceMessageFormat (messageObj: Message, chanel) {

        let mediaUrl;
        let userId;
        if (chanel === "whatsappMeta") {
            mediaUrl = await this.GetWhatsappMetaMedia('audio', messageObj.getVoiceUrl(), '_voice.ogg');
            // mediaUrl = msg.messages[0].url;
            userId = messageObj.getUserId();
        } else {
            mediaUrl = await this.GetWhatsappMedia('audio', messageObj.getVoiceId(), '_voice.ogg');
            userId = messageObj.getUserId();
        }

        const preferredLanguage = await new UserLanguage().getPreferredLanguageofSession(userId);
        const ConvertedToText = await this.speechtotext.SendSpeechRequest(mediaUrl, "whatsapp", preferredLanguage);
        if (preferredLanguage !== "null"){
            if (ConvertedToText) {
                const messagetoDialogflow = this.inputMessageFormat(messageObj);
                messagetoDialogflow.messageBody = String(ConvertedToText);
                messagetoDialogflow.type = 'voice';
                return messagetoDialogflow;
            }
            else {
                const messagetoDialogflow = this.inputMessageFormat(messageObj);
                messagetoDialogflow.messageBody = " ";
                messagetoDialogflow.type = 'text';
                return messagetoDialogflow;
            }
        }
        else {
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.messageBody = "Need to set language";
            messagetoDialogflow.type = 'text';
            return messagetoDialogflow;
        }
    }

    async imageMessaegFormat(messageObj: Message) {

        let response: any = {};
        response = await this.GetWhatsappMedia('photo', messageObj.getImageId(), '.jpg');
        console.log("response from GetWhatsappMedia", response);
        const location = await this.awsS3manager.uploadFile(response);
        console.log("response image whatsapp", location);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const url = require('url');
        const urlParse = url.parse(location);
        const imageUrl = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
        if (response){
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.type = 'image';
            messagetoDialogflow.messageBody = imageUrl;
            messagetoDialogflow.imageUrl = location;
            return messagetoDialogflow;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    async interactiveMessaegFormat(messageObj: Message) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getinteractivebutton().title);
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = emojiFilteredMessage;
        messagetoDialogflow.intent = messageObj.getinteractivebutton().id;
        return messagetoDialogflow;
    }

    async interactiveListMessaegFormat(messageObj: Message){
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getinteractivelist().title);
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = emojiFilteredMessage;
        messagetoDialogflow.intent = messageObj.getinteractivelist().id;
        return messagetoDialogflow;
    }

    async interactiveButtonMessaegFormat(messageObj: Message){
        const message = messageObj.getinteractivebutton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = message;
        messagetoDialogflow.intent = messageObj.getinteractivebutton().id;
        return messagetoDialogflow;
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

    inputMessageFormat (messageObj){
        const messagetoDialogflow: Imessage = {
            name                      : null,
            platform                  : "Whatsapp",
            chat_message_id           : messageObj.getChatId(),
            direction                 : "In",
            messageBody               : null,
            imageUrl                  : null,
            platformId                : null,
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
