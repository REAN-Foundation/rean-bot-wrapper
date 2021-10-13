
import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './awsfileupload.service';
import fs from 'fs';
import { createUserStat } from './statistics/UserStat.service';

import { v4 } from 'uuid';
import dialogflow from '@google-cloud/dialogflow';
const projectId = process.env.DIALOGFLOW_PROJECT_ID;

import { SendSpeechRequest } from './SpeechToTextService';
import http from 'https';

let dialoglowinstance = new DialogflowResponseService()

export const ReplyTelegramMessage = async (botObject, message) => {

    try {
        console.log(`the botObject is ${botObject} and the message is ${message}`)
        var response_message : any;//= { text: [], parse_mode:false, image: any };
        if (message.text) {
            saveRequestStatistics(message, message.text)
            console.log(`the text is ${message.text} and the id is ${message.chat.id.toString()}`)
            response_message = await dialoglowinstance.getDialogflowMessage(message.text, message.chat.id.toString());
        }
        else if (message.voice) {
            let response;
            response = await GetTelegramMedia(message.voice.file_id)
            if (response.result.file_path) {
                let ConvertedToText = await SendSpeechRequest('https://api.telegram.org/file/bot' + process.env.TELEGRAM_BOT_TOKEN + '/' + response.result.file_path, "telegram");
                if (ConvertedToText) {
                    response_message = await dialoglowinstance.getDialogflowMessage(ConvertedToText, message.chat.id.toString());
                } else {
                    response_message.text[0] = "I'm sorry, I did not understand that. Can you please try again?";
                }
            } else {
                response_message.text[0] = "Audio is not supported";
            }
        }
        else if (message.location) {
            let location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
            response_message = await dialoglowinstance.getDialogflowMessage(location_message, message.chat.id.toString());
        }
        else {
            response_message.text[0] = "Please enter text only!!";
        }
        let response;
        if (response_message.image && response_message.image.url) {
            response = await SendTelegramMediaMessage(botObject, message.chat.id, response_message.image.url, response_message.image.caption)
            saveResponseStatistics(message, response, response_message, response_message.image.caption, response_message.image.url)
        }
        else if (response_message.text.length > 1) {

            if (response_message.parse_mode && response_message.parse_mode == 'HTML') {

                const staticMessage = "We are working on response...";
                response = await SendTelegramMessage(botObject, message.chat.id,staticMessage);
                saveResponseStatistics(message, response, response_message, staticMessage)
                let uploadImageName;
                uploadImageName = await createFileFromHTML(response_message.text[0])
                const vaacinationImageFile = await uploadFile(uploadImageName);
                if (vaacinationImageFile) {
                    response = await SendTelegramMediaMessage(botObject, message.chat.id, vaacinationImageFile, response_message.text[1]);
                    saveResponseStatistics(message, response, response_message, response_message.text[1], vaacinationImageFile)
                    fs.unlink(uploadImageName, (err => { if (err) console.log(err); }));
                }
            }
            else {
                response = await SendTelegramMessage(botObject, message.chat.id, response_message.text[0]);
                saveResponseStatistics(message, response, response_message, response_message.text[0]);
                response = await SendTelegramMessage(botObject, message.chat.id, response_message.text[1]);
                saveResponseStatistics(message, response, response_message, response_message.text[1])
            }
        } else {
            response = await SendTelegramMessage(botObject, message.chat.id, response_message.text[0]);
            saveResponseStatistics(message, response, response_message, response_message.text[0]);
        }
    }
    catch (e) {
        console.log("Error:", e)
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

export const SendTelegramMessage = async (botObject, contact, message) => {
    message = sanitizeMessage(message)
    return new Promise((resolve, reject) => {
        botObject.sendMessage(contact, message, { parse_mode: 'HTML' }).then(function (data) {
            resolve(data)
        });
    });
}

export const SendTelegramMediaMessage = async (botObject, contact, imageLink, message) => {
    message = sanitizeMessage(message);
    return new Promise((resolve, reject) => {

        botObject.sendPhoto(
            contact,
            imageLink,
            { caption: message }
        )
            .then(function (data) {
                resolve(data)
            });
    });
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

function saveRequestStatistics(req, message) {

    const user_data = {
        name: req.from.first_name + " "+ req.from.last_name,
        platform: "Telegram",
        contact: req.from.id,
        chat_message_id: req.message_id,
        direction: 'In',
        message_type: "text",
        message_content: message
    };
    createUserStat(user_data);
}

function saveResponseStatistics(req, response, service_response, message, image_url = null) {
    const user_data = {
        name: req.from.first_name + " "+ req.from.last_name,
        platform: "Telegram",
        contact: req.from.id,
        chat_message_id: response.messages_id,
        direction: 'Out',
        message_type: image_url ? "image" : "text",
        message_content: message,
        image_url: image_url,
        raw_response_object: service_response.result && service_response.result.fulfillmentMessages ? JSON.stringify(service_response.result.fulfillmentMessages) : '',
        intent: service_response.result && service_response.result.intent ? service_response.result.intent.displayName : ''
    };
    createUserStat(user_data);
}