
// import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './aws.file.upload.service';
import { message, response } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import  TelegramBot  from 'node-telegram-bot-api';
import { MessageFlow } from './get.put.message.flow.service';
import http from 'https';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Speechtotext } from './speech.to.text.service';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{

    public _telegram: TelegramBot = null;

    public res;

    // public req;
    constructor(private Speechtotext?: Speechtotext, private messageFlow?: MessageFlow ) {
        this._telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
        const client = null;
        this.init(client);
    }
    
    emojiUnicode = async (emoji) => {
        // eslint-disable-next-line init-declarations
        let comp;
        if (emoji.length === 1) {
            comp = emoji.charCodeAt(0);
        }
        comp = (
            (emoji.charCodeAt(0) - 0xD800) * 0x400
            + (emoji.charCodeAt(1) - 0xDC00) + 0x10000
        );
        if (comp < 0) {
            comp = emoji.charCodeAt(0);
        }
        return comp.toString("16");
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMessage(msg, client: string){
        this._telegram.processUpdate(msg);
        console.log("message sent to events");
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendManualMesage(msg){
        return this.messageFlow.send_manual_msg(msg, this);
    }

    init(client){
        this._telegram.setWebHook(process.env.BASE_URL + '/v1/telegram/' + process.env.TELEGRAM_BOT_TOKEN + '/receive');
        console.log("Telegram webhook set," );
        this._telegram.on('message', msg => {
            this.messageFlow.get_put_msg_Dialogflow(msg, client, this);
        });
    }

    getMessage = async (message) =>{
        console.log("enter the getMessage of telegram", message);
        // eslint-disable-next-line init-declarations
        let returnMessage: message;
        const telegram_id = message.chat.id.toString();
        const name = message.from.first_name;
        const chat_message_id = message.message_id;
        if (message.text) {
            const regexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
            let emojiInString = regexExp.test(message.text);
            if(emojiInString) {
                message = await this.emojiUnicode(message.text) === "1f44e" ? "NegativeFeedback" : "PositiveFeedback";
            }
            else{
                message = message.text;
            }

            returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: message,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'text' };
        }
        else if (message.voice) {
            let response: any = {};
            console.log("this is voice", message.voice);
            response = await this.GetTelegramMedia(message.voice.file_id);
            console.log("response of telegram media is", response);
            const file_path = response.result.file_path;
            if (file_path) {
                const ConvertedToText = await this.Speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + process.env.TELEGRAM_BOT_TOKEN + '/' + response.result.file_path, "telegram");
                if (ConvertedToText) {
                    returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: String(ConvertedToText),sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'voice' };
                } else {
                    returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'text' };
                }
            } else {
                returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'text' };
            }
        }
        else if (message.location) {
            const location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
            returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: location_message,type: 'location' };
        }
        else {
            returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: message[0].type };
        }
        return returnMessage;
    }

    postResponse = async(message, processedResponse) => {
        console.log("enter the give response of tele");
        // eslint-disable-next-line init-declarations
        let reaponse_message: response;
        const telegram_id = message.sessionId;
        const input_message = message.messageBody;
        const name = message.name;
        const chat_message_id = message.chat_message_id;
        const raw_response_object = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(processedResponse.message_from_dialoglow.result.fulfillmentMessages) : '';
        const intent = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.intent ? processedResponse.message_from_dialoglow.result.intent.displayName : '';

        if (processedResponse.message_from_dialoglow.image && processedResponse.message_from_dialoglow.image.url) {
            reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: processedResponse.image , messageImageCaption: processedResponse.image.url, sessionId: telegram_id, messageText: null };
        }
        else if (processedResponse.processed_message.length > 1) {

            if (processedResponse.message_from_dialoglow.parse_mode && processedResponse.message_from_dialoglow.parse_mode === 'HTML') {
                const uploadImageName = await createFileFromHTML(processedResponse.processed_message[0]);
                const vaacinationImageFile = await uploadFile(uploadImageName);
                if (vaacinationImageFile) {
                    reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",raw_response_object: raw_response_object,intent: intent,messageBody: String(vaacinationImageFile), messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
                reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[1] };
            }
        } else {
            reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
        }
        return reaponse_message;
    }

    createFinalMessageFromHumanhandOver(requestBody) {
        const response_message: response = {
            name                : requestBody.agentName,
            platform            : "Telegram",
            chat_message_id     : null,
            direction           : "Out",
            input_message       : null,
            message_type        : "text",
            raw_response_object : null,
            intent              : null,
            messageBody         : null,
            messageImageUrl     : null,
            messageImageCaption : null,
            sessionId           : requestBody.userId,
            messageText         : requestBody.message
        };
        return response_message;
    }

    SendMediaMessage = async (contact, imageLink = null, message) => {
        message = this.sanitizeMessage(message);
        return new Promise((resolve) => {

            if (imageLink === null){
                this._telegram.sendMessage(contact, message, { parse_mode: 'HTML' }).then(function (data) {
                    resolve(data);
                });
            }
            else this._telegram.sendPhoto(
                contact,
                imageLink,
                { caption: message }
            )
                .then(function (data) {
                    resolve(data);
                });
        });
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

    sanitizeMessage(message) {
        if (message > 4096) {
            var strshortened = message.slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
            strshortened = strshortened.replace(/(<\/ b>|<\/b>)/mgi, "</b>");
            message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
        }
        return message;
    }

}
