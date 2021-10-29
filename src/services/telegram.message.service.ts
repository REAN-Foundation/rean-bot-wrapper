
// import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './aws.file.upload.service';
import { message, response } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import  TelegramBot  from 'node-telegram-bot-api';
import { MessageFlow } from './get.put.message.flow.service'

import { Speechtotext } from './speech.to.text.service';
import http from 'https';
import { platformServiceInterface } from '../refactor/interface/platform.interface';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{
    public _telegram: TelegramBot = null;
    public res;
    // public req;
    constructor(private Speechtotext?: Speechtotext, private messageFlow?: MessageFlow ) {
            this._telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
            let client = null
            this.init(client);
    }

    handleMessage(msg, client: String){
        this._telegram.processUpdate(msg)
        console.log("message sent to events")
        return null;
    }

    init(client){
        this._telegram.setWebHook(process.env.BASE_URL + '/v1/telegram/' + process.env.TELEGRAM_BOT_TOKEN + '/receive');
        console.log("Telegram webhook set," )
        this._telegram.on('message', msg => {
            this.messageFlow.get_put_msg_Dialogflow(msg, client, this);
        });
    }

    getMessage = async (message) =>{
        console.log("enter the getMessage of telegram", message)
        let returnMessage: message;
        let telegram_id = message.chat.id.toString();
        let name = message.from.first_name
        let chat_message_id = message.message_id
        if (message.text) {
            returnMessage = {name:name, platform:"Telegram",chat_message_id:chat_message_id,direction:"In",messageBody:message.text,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'text'}
        }
        else if (message.voice) {
            let response;
            response = await GetTelegramMedia(message.voice.file_id)
            if (response.result.file_path) {
                let ConvertedToText = await this.Speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + process.env.TELEGRAM_BOT_TOKEN + '/' + response.result.file_path, "telegram");
                if (ConvertedToText) {
                    returnMessage = {name:name, platform:"Telegram",chat_message_id:chat_message_id,direction:"In",messageBody:String(ConvertedToText),sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'voice'}
                } else {
                    returnMessage = {name:name, platform:"Telegram",chat_message_id:chat_message_id,direction:"In",messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'text'}
                }
            } else {
                returnMessage = {name:name, platform:"Telegram",chat_message_id:chat_message_id,direction:"In",messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'text'}
            }
        }
        else if (message.location) {
            let location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
            returnMessage = {name:name, platform:"Telegram",chat_message_id:chat_message_id,direction:"In",messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:location_message,type:'location'}
        }
        else {
            returnMessage = {name:name, platform:"Telegram",chat_message_id:chat_message_id,direction:"In",messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:message[0].type}
        }
        return returnMessage;
    }

    postResponse = async(message, response) => {
        console.log("enter the give response of tele")
        let reaponse_message: response;
        let telegram_id = message.sessionId;
        let input_message = message.messageBody;
        let name = message.name;
        let chat_message_id= message.chat_message_id
        let raw_response_object = response.text_part_from_DF.result && response.text_part_from_DF.result.fulfillmentMessages ? JSON.stringify(response.text_part_from_DF.result.fulfillmentMessages) : '';
        let intent = response.text_part_from_DF.result && response.text_part_from_DF.result.intent ? response.text_part_from_DF.result.intent.displayName : '';
        if (response.text_part_from_DF.image && response.text_part_from_DF.image.url) {
            reaponse_message = {name:name,platform:"Telegram",chat_message_id:chat_message_id,direction:"Out",input_message:input_message,message_type:"image",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:response.text_part_from_DF.image , messageImageCaption: response.text_part_from_DF.image.url, sessionId: telegram_id, messageText:null}
        }
        else if (response.processed_message.length > 1) {

            if (response.text_part_from_DF.parse_mode && response.text_part_from_DF.parse_mode == 'HTML') {
                let uploadImageName;
                uploadImageName = await createFileFromHTML(response.processed_message[0])
                const vaacinationImageFile = await uploadFile(uploadImageName);
                if (vaacinationImageFile) {
                    reaponse_message = {name:name,platform:"Telegram",chat_message_id:chat_message_id,direction:"Out",input_message:input_message,message_type:"image",raw_response_object:raw_response_object,intent:intent,messageBody:String(vaacinationImageFile), messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:response.processed_message[1]}
                }
            }
            else {
                reaponse_message = {name:name,platform:"Telegram",chat_message_id:chat_message_id,direction:"Out",input_message:input_message,message_type:"text",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:response.processed_message[0]}
                reaponse_message = {name:name,platform:"Telegram",chat_message_id:chat_message_id,direction:"Out",input_message:input_message,message_type:"text",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:response.processed_message[1]}
            }
        } else {
            reaponse_message = {name:name,platform:"Telegram",chat_message_id:chat_message_id,direction:"Out",input_message:input_message,message_type:"text",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:response.processed_message[0]}
        }
        return reaponse_message;
    }

    SendMediaMessage = async (contact, imageLink = null, message) => {
        message = sanitizeMessage(message);
        return new Promise((resolve, reject) => {
    
            if (imageLink === null){
                this._telegram.sendMessage(contact, message, { parse_mode: 'HTML' }).then(function (data) {
                    resolve(data)
                });
            }
            else this._telegram.sendPhoto(
                contact,
                imageLink,
                { caption: message }
            )
                .then(function (data) {
                    resolve(data)
                });
        });
    }
}


function sanitizeMessage(message) {
    if (message > 4096) {
        var strshortened = message.slice(0, 3800);
        strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
        strshortened = strshortened.replace(/(<\/ b>|<\/b>)/mgi, "</b>");
        message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.'
    }
    return message;
}

/* get media details send by user */
export const GetTelegramMedia = async (fileid) => {

    return new Promise((resolve, reject) => {

        const req = http.request(process.env.TELEGRAM_MEDIA_PATH_URL + '?file_id=' + fileid, res => {
            let data = " ";
            res.on('data', d => {
                data += d
            })
            res.on("end", () => {
                resolve(JSON.parse(data));
            })
        })

        req.on('error', error => {
            reject(error)
        })
        req.end();
    });
}