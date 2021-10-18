
import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './awsfileupload.service';
import fs from 'fs';
import { message, response } from '../Refactor/interface/interface';
import { autoInjectable } from 'tsyringe';
import { TelegramStatistics } from './SaveStatistics';
import { translateService } from '../services/translate'

// import { v4 } from 'uuid';
// import dialogflow from '@google-cloud/dialogflow';
const projectId = process.env.DIALOGFLOW_PROJECT_ID;

import { Speechtotext } from './SpeechToTextService';
import http from 'https';

@autoInjectable()
export class ReplyTelegramMessage{

    constructor(private TelegramStatistics?: TelegramStatistics,
        private Speechtotext?: Speechtotext,
        private translateService?:translateService,
        private DialogflowResponseService?: DialogflowResponseService) {
    }

    // handleUserRequest = async (botObject, message) => {
    //     let message_from_dialoglow:any;
    //     let processed_message: any;
    //     let translate_message: any;
    //     let telegram_id = message.chat.id.toString();
    //     let messagetoDialogflow = await this.getMessage(message);
    //     this.TelegramStatistics.saveRequestStatistics(message, message.text);

    //     //get the translated message
    //     translate_message = await this.translateService.translateMessage(messagetoDialogflow.messageBody)

    //     message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, telegram_id);

    //     // process the message from dialogflow before sending it to whatsapp
    //     processed_message = await this.translateService.processdialogflowmessage(message_from_dialoglow)

    //     let response_format = await this.giveResponse(message, processed_message);
    //     if (message_from_dialoglow) {
    //         let message_to_platform = null;
    //         message_to_platform = await this.SendTelegramMediaMessage(botObject, telegram_id, response_format.messageBody,response_format.messageText)       
    //         if (!message_from_dialoglow) {
    //             console.log('An error occurred while sending messages!');
    //         }
    //     }
    //     else {
    //         console.log('An error occurred while processing messages!');
    //     }   
    // }


    getMessage = async (message) =>{
        console.log("enter the getMessage of telegram", message)
        let returnMessage: message;
        let telegram_id = message.chat.id.toString();
        if (message.text) {
            returnMessage = {messageBody:message.text,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'text'}
        }
        else if (message.voice) {
            let response;
            response = await GetTelegramMedia(message.voice.file_id)
            if (response.result.file_path) {
                let ConvertedToText = await this.Speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + process.env.TELEGRAM_BOT_TOKEN + '/' + response.result.file_path, "telegram");
                if (ConvertedToText) {
                    returnMessage = {messageBody:String(ConvertedToText),sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'voice'}
                } else {
                    returnMessage = {messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'text'}
                }
            } else {
                returnMessage = {messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:'text'}
            }
        }
        else if (message.location) {
            let location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
            returnMessage = {messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:location_message,type:'location'}
        }
        else {
            returnMessage = {messageBody:null,sessionId:telegram_id,replayPath:telegram_id,latlong:null,type:message[0].type}
        }
        return returnMessage;
    }

    giveResponse = async(message, message_from_dialoglow) => {
        console.log("enter the give response of tele")
        let reaponse_message: response;
        let telegram_id = message.sessionId;
        if (message_from_dialoglow.image && message_from_dialoglow.image.url) {
            reaponse_message = {messageBody:null, messageImageUrl:message_from_dialoglow.image , messageImageCaption: message_from_dialoglow.image.url, sessionId: telegram_id, messageText:null}
        }
        else if (message_from_dialoglow.text.length > 1) {

            if (message_from_dialoglow.parse_mode && message_from_dialoglow.parse_mode == 'HTML') {
                let uploadImageName;
                uploadImageName = await createFileFromHTML(message_from_dialoglow.text[0])
                const vaacinationImageFile = await uploadFile(uploadImageName);
                if (vaacinationImageFile) {
                    reaponse_message = {messageBody:String(vaacinationImageFile), messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:message_from_dialoglow.text[1]}
                }
            }
            else {
                reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:message_from_dialoglow.text[0]}
                reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:message_from_dialoglow.text[1]}
            }
        } else {
            reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: telegram_id, messageText:message_from_dialoglow.text[0]}
        }
        return reaponse_message;
    }

    SendTelegramMediaMessage = async (botObject, contact, imageLink = null, message) => {
        message = sanitizeMessage(message);
        return new Promise((resolve, reject) => {
    
            if (imageLink === null){
                botObject.sendMessage(contact, message, { parse_mode: 'HTML' }).then(function (data) {
                    resolve(data)
                });
            }
            else botObject.sendPhoto(
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
            //console.log(`statusCode: ${res.statusCode}`)
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