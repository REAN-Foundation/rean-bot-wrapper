//testing purpose

import http from  'https';
import fs from 'fs';
import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './awsfileupload.service';
import { Speechtotext } from './SpeechToTextService';
import { WhatsappStatistics } from './SaveStatistics';
import { autoInjectable } from 'tsyringe';
import { response, message } from '../Refactor/interface/interface';

// let dialoglowinstance = new DialogflowResponseService();


function emojiUnicode(emoji) {
    var comp;
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

function sanitizeMessage(message) {
    if (message) {
        message = message.replace(/<b> /g, "*").replace(/<b>/g, "*").replace(/ <\/b>/g, "* ").replace(/ <\/ b>/g, "* ").replace(/<\/b>/g, "* ");
        if (message.length > 4096) {

            var strshortened = message.slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
            message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.'
        }
    }
    return message;
}
@autoInjectable()
export class WhatsappMessageService{

    constructor(private WhatsappStatistics?: WhatsappStatistics,
                private Speechtotext?: Speechtotext,
                private DialogflowResponseService?: DialogflowResponseService) {
    }
    
    SetWebHook = async () => {

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'url': `${process.env.BASE_URL}/v1/whatsapp/receive`,
            });
    
            const options = {
                hostname: process.env.WHATSAPP_LIVE_HOST,
                path: '/v1/configs/webhook',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'D360-Api-Key': process.env.WHATSAPP_LIVE_API_KEY
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    resolve(true);
                });
                response.on('end', () => {
                    console.log("Whbhook URL set for Whatsapp")
                    resolve(true);
                });
            });
    
            request.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject();
            });
            // Write data to request body
            request.write(postData);
            request.end();
        });
    }
    
    SetWebHookOldNumber = async () => {
    
        return new Promise((resolve, reject) => {
            if (process.env.WHATSAPP_LIVE_API_KEY_OLD_NUMBER) {
    
                const postData = JSON.stringify({
                    'url': `${process.env.BASE_URL}/v1/whatsapp/old-number/receive`,
                });
    
                const options = {
                    hostname: process.env.WHATSAPP_LIVE_HOST,
                    path: '/v1/configs/webhook',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'D360-Api-Key': process.env.WHATSAPP_LIVE_API_KEY_OLD_NUMBER
                    }
                };
                const request = http.request(options, (response) => {
                    response.setEncoding('utf8');
                    response.on('data', (chunk) => {
                        resolve(true);
                    });
                    response.on('end', () => {
                        console.log("Whbhook URL set for old Whatsapp number")
                        resolve(true);
                    });
                });
    
                request.on('error', (e) => {
                    console.error(`problem with request: ${e.message}`);
                    reject();
                });
                // Write data to request body
                request.write(postData);
                request.end();
            }
        });
    }
    
    SendWhatsappMessageOldNumber = async (contact, message) => {
    
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'recipient_type': 'individual',
                'to': contact,
                'type': 'text',
                'text': {
                    'body': message
                }
            });
    
            const options = {
                hostname: process.env.WHATSAPP_LIVE_HOST,
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'D360-Api-Key': process.env.WHATSAPP_LIVE_API_KEY_OLD_NUMBER
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    resolve(true);
                });
                response.on('end', () => {
                    resolve(true);
                });
            });
    
            request.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject();
            });
            // Write data to request body
            request.write(postData);
            request.end();
        });
    }

    SendWhatsappMediaMessage = async (contact,imageLink, message) => {
        return new Promise((resolve, reject) => {
                console.log("this is SendWhatsappMediaMessage.....", message)
                message = sanitizeMessage(message)
                const postData = imageLink ? JSON.stringify({
                    'recipient_type': 'individual',
                    'to': contact,
                    'type': 'image',
                    "image": {
                        "link": imageLink,
                        "caption": message
                    }
                }): JSON.stringify({
                    'recipient_type': 'individual',
                    'to': contact,
                    'type': 'text',
                    'text': {
                        'body': message
                    }
                })
                const options = {
                    hostname: process.env.WHATSAPP_LIVE_HOST,
                    path: '/v1/messages',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'D360-Api-Key': process.env.WHATSAPP_LIVE_API_KEY
                    }
                };
                const request = http.request(options, (response) => {
                    response.setEncoding('utf8');
                    response.on('data', (chunk) => {
                        resolve(chunk);
                    });
                    response.on('end', () => {
                        resolve(true);
                    });
                });
                request.on('error', (e) => {
                    console.error(`problem with request: ${e.message}`);
                    reject();
                });
                request.write(postData);
                request.end();  
        });
    }
    
    SendWhatsappMessage = async (contact, message) => {
        message = sanitizeMessage(message);
        return new Promise((resolve, reject) => {
    
            const postData = JSON.stringify({
                'recipient_type': 'individual',
                'to': contact,
                'type': 'text',
                'text': {
                    'body': message
                }
            });
    
            const options = {
                hostname: process.env.WHATSAPP_LIVE_HOST,
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'D360-Api-Key': process.env.WHATSAPP_LIVE_API_KEY
                }
            };
    
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    console.log("on data", chunk)
                    resolve(chunk);
                });
                response.on('end', () => {
                    // console.log("on end")
                    resolve(true);
                });
            });
    
            request.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject();
            });
            // Write data to request body
            request.write(postData);
            request.end();
        });
    }
    
    /*retrive whatsapp media */
    GetWhatsappMedia = async (mediaId) => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: process.env.WHATSAPP_LIVE_HOST,
                path: '/v1/media/' + mediaId,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'D360-Api-Key': process.env.WHATSAPP_LIVE_API_KEY
                }
            };

            const request = http.request(options, (response) => {
                response.on('data', (chunk) => {
                    let file_name = 'audio/' + Date.now() + '_voice.ogg';
                    fs.writeFile('./' + file_name, chunk, err => {
                        if (err) {
                            reject(err)
                            return
                        } else {
                            resolve(file_name);
                        }
                    })
                });
            });
    
            request.on('error', (e) => {
                reject(e)
            });
            request.end();
        });
    }

    getMessage = async (req) =>{
        let returnMessage: message;
        let whatsapp_id = req.body.contacts[0].wa_id;
        if (req.body.messages[0].type == "text") {
            let message = req.body.messages[0].text.body;
    
            const regexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
            if (regexExp.test(message)) {
                message = emojiUnicode(message) == "1f44e" ? "NegativeFeedback" : "PositiveFeedback"
            }
            
            returnMessage = {messageBody:message,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:'text'}
    
        }
        else if (req.body.messages[0].type == "location") {
            let loc = `latlong:${req.body.messages[0].location.latitude}-${req.body.messages[0].location.longitude}`;
            returnMessage = {messageBody:null,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:loc,type:'location'}
        }
        else if (req.body.messages[0].type == "voice") {
            let mediaUrl = await this.GetWhatsappMedia(req.body.messages[0].voice.id);
            console.log("the mediaUrl", mediaUrl)
            let ConvertedToText = await this.Speechtotext.SendSpeechRequest(mediaUrl, "whatsapp");
            if (ConvertedToText) {
                returnMessage = {messageBody:String(ConvertedToText),sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:req.body.messages[0].type}
            }
            else {
                returnMessage = {messageBody:null,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:req.body.messages[0].type}
            }
        }else {
            returnMessage = {messageBody:null,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:req.body.messages[0].type}
        }
        return returnMessage;
    }

    postResponse = async ( message, message_from_dialoglow ) => {
        let reaponse_message: response;
        let whatsapp_id = message.sessionId;
        if (message_from_dialoglow) {
            if (message_from_dialoglow.image && message_from_dialoglow.image.url) {
                reaponse_message = {messageBody:null, messageImageUrl:message_from_dialoglow.image , messageImageCaption: message_from_dialoglow.image.url, sessionId: whatsapp_id, messageText:null }
            }
            else if (message_from_dialoglow.text.length > 1) {
                if (message_from_dialoglow.parse_mode && message_from_dialoglow.parse_mode == 'HTML') {
                    let uploadImageName;
                    uploadImageName = await createFileFromHTML(message_from_dialoglow.text[0])
                    const vaacinationImageFile = await uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = {messageBody:String(vaacinationImageFile), messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id, messageText:message_from_dialoglow.text[1] }
                    }
                }
                else {
                    reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id, messageText:message_from_dialoglow.text[0] }
                    reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id, messageText:message_from_dialoglow.text[1] }
                }
            }
            else {
                reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id, messageText:message_from_dialoglow.text[0] }
            }
        }
        return reaponse_message;
    }
}