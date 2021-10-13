//testing purpose

import http from  'https';
import fs from 'fs';
import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './awsfileupload.service';
import { SendSpeechRequest } from './SpeechToTextService';
import { createUserStat } from './statistics/UserStat.service';
import { injectable } from 'tsyringe';

let dialoglowinstance = new DialogflowResponseService();


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
@injectable()
export class WhatsappMessageService{
    
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
    
    handleUserRequest = async (req) => {
        let response_message: any;
        let whatsapp_id = req.body.contacts[0].wa_id;
        if (req.body.messages[0].type == "text") {
            let message = req.body.messages[0].text.body;
    
            const regexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
            if (regexExp.test(message)) {
                message = emojiUnicode(message) == "1f44e" ? "NegativeFeedback" : "PositiveFeedback"
            }
    
            saveRequestStatistics(req, message);
            response_message = await dialoglowinstance.getDialogflowMessage(message, whatsapp_id);
    
    
        }
        else if (req.body.messages[0].type == "location") {
            let message = `latlong:${req.body.messages[0].location.latitude}-${req.body.messages[0].location.longitude}`;
            saveRequestStatistics(req, message);
            response_message = await dialoglowinstance.getDialogflowMessage(message, whatsapp_id);
        }
        else if (req.body.messages[0].type == "voice") {
            let mediaUrl = await this.GetWhatsappMedia(req.body.messages[0].voice.id);
            let ConvertedToText = await SendSpeechRequest(mediaUrl, "whatsapp");
            if (ConvertedToText) {
                response_message = await dialoglowinstance.getDialogflowMessage(ConvertedToText, whatsapp_id);
            } else {
                response_message = {text: []};
                response_message.text[0] = "I'm sorry, I did not understand that. Can you please try again?";
            }
        } else {
            response_message.text[0] = "Please enter Text, Location / voice message only!!";
        }
        if (response_message) {
            let response;
            if (response_message.image && response_message.image.url) {
                response = await this.SendWhatsappMediaMessage(whatsapp_id, response_message.image.url, response_message.image.caption);
                saveResponseStatistics(req, response, response_message, response_message.image.caption, response_message.image.url)
            }
            else if (response_message.text.length > 1) {
                if (response_message.parse_mode && response_message.parse_mode == 'HTML') {
                    const staticMessage = "We are working on response...";
                    response = await this.SendWhatsappMessage(whatsapp_id, staticMessage);
                    saveResponseStatistics(req, response, response_message, staticMessage)
                    let uploadImageName;
                    uploadImageName = await createFileFromHTML(response_message.text[0])
                    const vaacinationImageFile = await uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        response = await this.SendWhatsappMediaMessage(whatsapp_id, vaacinationImageFile, response_message.text[1]);
                        saveResponseStatistics(req, response, response_message, response_message.text[1], vaacinationImageFile)
                        fs.unlink(uploadImageName, (err => { if (err) console.log(err); }));
                    }
                }
                else {
                    response = await this.SendWhatsappMessage(whatsapp_id, response_message.text[0]);
                    saveResponseStatistics(req, response, response_message, response_message.text[0]);
                    response = await this.SendWhatsappMessage(whatsapp_id, response_message.text[1]);
                    saveResponseStatistics(req, response, response_message, response_message.text[1])
                }
            }
            else {
                response = await this.SendWhatsappMessage(whatsapp_id, response_message.text[0]);
                saveResponseStatistics(req, response, response_message, response_message.text[0]);
            }
            if (!response) {
                console.log('An error occurred while sending messages!');
            }
        }
        else {
            console.log('An error occurred while processing messages!');
        }
    }
    SendWhatsappMessage = async (contact, message) => {
        console.log("this is SendWhatsappMessage.....")
        message = sanitizeMessage(message)
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
            // Write data to request body
            request.write(postData);
            request.end();
        });
    }
    
    SendWhatsappMediaMessage = async (contact, imageLink, message) => {
        console.log("this is SendWhatsappMediaMessage.....", imageLink)
        message = sanitizeMessage(message);
        return new Promise((resolve, reject) => {
    
            const postData = JSON.stringify({
                'recipient_type': 'individual',
                'to': contact,
                'type': 'image',
                "image": {
                    "link": imageLink,
                    "caption": message
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
}

function saveRequestStatistics(req, message) {

    const user_data = {
        name: req.body.contacts[0].profile.name,
        platform: "Whatsapp",
        contact: req.body.contacts[0].wa_id,
        chat_message_id: req.body.messages[0].id,
        direction: 'In',
        message_type: req.body.messages[0].type,
        message_content: message
    };
    createUserStat(user_data);
}

function saveResponseStatistics(req, response, service_response, message, image_url = null) {
    response = JSON.parse(response)
    const user_data = {
        name: req.body.contacts[0].profile.name,
        platform: "Whatsapp",
        contact: req.body.contacts[0].wa_id,
        chat_message_id: response.messages[0].id,
        direction: 'Out',
        message_type: image_url ? "image" : "text",
        message_content: message,
        image_url: image_url,
        raw_response_object: service_response.result && service_response.result.fulfillmentMessages ? JSON.stringify(service_response.result.fulfillmentMessages) : '',
        intent: service_response.result && service_response.result.intent ? service_response.result.intent.displayName : ''
    };
    createUserStat(user_data);
}