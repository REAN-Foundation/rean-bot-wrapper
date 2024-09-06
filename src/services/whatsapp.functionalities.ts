/* eslint-disable max-len */
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import http from  'https';
import fs from 'fs';
import { Imessage } from '../refactor/interface/message.interface';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { Speechtotext } from './speech.to.text.service';
import { inject, Lifecycle, scoped } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';
import { AwsS3manager } from "./aws.file.upload.service";
import { UserLanguage } from "./set.language";
import needle from 'needle';
import { Message } from './request.format/whatsapp.message.format';
import { getRequestOptions } from "../utils/helper";

@scoped(Lifecycle.ContainerScoped)
export class MessageFunctionalities implements getMessageFunctionalities {

    constructor(@inject(EmojiFilter) private emojiFilter?: EmojiFilter,
        @inject(Speechtotext) private speechtotext?: Speechtotext,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(UserLanguage) private userLanguage?: UserLanguage,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async textMessageFormat (messageObj:Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const text = messageObj.getText();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(text);
        messagetoDialogflow.messageBody = text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        return messagetoDialogflow;
    }

    async reactionMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const reaction = messageObj.getReaction();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(reaction.emoji);
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        messagetoDialogflow.messageBody = reaction.emoji;
        messagetoDialogflow.type = 'reaction';
        messagetoDialogflow.contextId = reaction.messageId;
        return messagetoDialogflow;
    }

    async locationMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const loc = `latlong:${messageObj.getLocation().latitude}-${messageObj.getLocation().longitude}`;
        messagetoDialogflow.type = 'location';
        messagetoDialogflow.latlong = messageObj.getLocation();
        messagetoDialogflow.messageBody = loc;
        return messagetoDialogflow;
    }

    async voiceMessageFormat (messageObj: Message) {
        const mediaUrl = await this.GetWhatsappMedia('audio', messageObj.getVoiceId(), '_voice.ogg');
        return await this.commonVoiceAudioFormat(messageObj, mediaUrl);
    }

    async audioMessageFormat (messageObj: Message) {
        // eslint-disable-next-line init-declarations
        let audioFilePath = '';
        if (messageObj.getChannel() === "whatsappMeta") {
            const audioUrlsentByMeta = await this.getMetaMediaUrl(messageObj.getAudioId());
            audioFilePath = await this.GetWhatsappMetaMedia('audio', audioUrlsentByMeta, '_voice.ogg');
        } else {
            audioFilePath = await this.GetWhatsappMedia('audio', messageObj.getAudioId(), '_voice.ogg');
        }
        return await this.commonVoiceAudioFormat(messageObj, audioFilePath);
    }

    async imageMessageFormat(messageObj: Message) {
        let imageFilePath = '';
        if (messageObj.getChannel() === 'whatsapp'){
            imageFilePath = await this.GetWhatsappMedia('photo', messageObj.getImageId(), '.jpg');
        }
        else {
            const imageUrlSentByMeta = await this.getMetaMediaUrl(messageObj.getImageId());
            imageFilePath = await this.GetWhatsappMetaMedia('photo', imageUrlSentByMeta, '.jpg');
        }
        const location = await this.awsS3manager.uploadFile(imageFilePath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const url = require('url');
        const urlParse = url.parse(location);
        const imageUrl = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
        if (imageFilePath){
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.type = 'image';
            messagetoDialogflow.messageBody = imageUrl;
            messagetoDialogflow.imageUrl = location;
            return messagetoDialogflow;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    async interactiveMessageFormat(messageObj: Message) {
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getinteractivebutton().title);
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = emojiFilteredMessage;
        messagetoDialogflow.intent = messageObj.getinteractivebutton().id;
        return messagetoDialogflow;
    }

    async list_replyMessageFormat(messageObj: Message){
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getinteractivelist().title);
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = emojiFilteredMessage;
        messagetoDialogflow.intent = messageObj.getinteractivelist().id;
        const description = messageObj.getinteractivelist().description;
        //need to change the structure of messagetoDialogflow such that it considers description when message type is list
        //the below loop is just a temporary measure to make get description in delete reminders
        if(description){
            messagetoDialogflow.messageBody = description + ',' + emojiFilteredMessage;
        }
        return messagetoDialogflow;
    }

    async button_replyMessageFormat(messageObj: Message){
        const message = messageObj.getinteractivebutton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = message;
        messagetoDialogflow.intent = messageObj.getinteractivebutton().id;
        return messagetoDialogflow;
    }

    async buttonMessageFormat(messageObj: Message){
        const message = messageObj.getTemplateReplyButton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = message;
        messagetoDialogflow.intent = messageObj.getTemplateReplyButton().id;
        return messagetoDialogflow;
    }

    /*retrive whatsapp media */
    GetWhatsappMedia = async (type, mediaId, extension) => {
        return new Promise<string>((resolve, reject) => {
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

    GetWhatsappMetaMedia = async (type, imageUrl, extension) => {
        return new Promise<string>((resolve, reject) => {
            const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
            const headers = {
                headers : {
                    'Authorization' : `Bearer ${token}`,
                }
            };
            try {
                needle.get(imageUrl, headers, function(err, resp, body) {
                    if (err){
                        console.log('FAiled to REad File',err);
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
            name              : null,
            platform          : messageObj.getChannel(),
            chat_message_id   : messageObj.getChatId(),
            direction         : "In",
            messageBody       : null,
            imageUrl          : null,
            platformId        : null,
            replyPath         : null,
            latlong           : null,
            type              : "text",
            intent            : null,
            responseMessageID : null,
            contextId         : messageObj.getContextId()
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

    async commonVoiceAudioFormat(messageObj,mediaUrl) {
        const userId = messageObj.getUserId();
        const preferredLanguage = await this.userLanguage.getPreferredLanguageofSession(userId);
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

    async getMetaMediaUrl(mediaId){
        try {
            const options = getRequestOptions();
            const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
            options.headers['Content-Type'] = 'application/json';
            options.headers['Authorization'] = `Bearer ${token}`;
            const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
            const path = `/v14.0/${mediaId}`;
            const apiUrl_meta = hostname + path;
            const response = await needle("get",apiUrl_meta, options);
            return response.body.url;
        }
        catch (error) {
            console.log("error", error);
        }
    }

}
