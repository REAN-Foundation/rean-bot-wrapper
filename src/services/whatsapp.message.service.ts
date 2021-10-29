import http from  'https';
import fs from 'fs';
import { uploadFile, createFileFromHTML } from './aws.file.upload.service';
import { Speechtotext } from './speech.to.text.service';
import { autoInjectable, singleton } from 'tsyringe';
import { response, message } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{
    public res;
    constructor(private Speechtotext?: Speechtotext,
                private messageFlow?: MessageFlow) {
                    this.SetWebHook()
    }

    handleMessage(msg: any, client: String) {
        console.log("entered the handle msg in whatsapp msg ser")
        return this.messageFlow.get_put_msg_Dialogflow(msg, client, this);   
    }
    init() {
        throw new Error('Method not implemented.');
    }
    
    SetWebHook = async () => {

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'url': `${process.env.BASE_URL}/v1/whatsapp/${process.env.TELEGRAM_BOT_TOKEN}/receive`,
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

    emojiUnicode = async (emoji) => {
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
    
    sanitizeMessage = (message) => {
        if (message) {
            message = message.replace(/<b> /g, "*").replace(/<b>/g, "*").replace(/ <\/b>/g, "* ").replace(/ <\/ b>/g, "* ").replace(/<\/b>/g, "* ");
            if (message.length > 4096) {
    
                var strshortened = message.slice(0, 3800);
                strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
                message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.'
            }
        }
        console.log("msg  has been santised", message)
        return message;
    }

    SendMediaMessage = async (contact,imageLink, message) => {
        return new Promise((resolve, reject) => {
                message = this.sanitizeMessage(message)
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
                console.log("this is the postData", postData)
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

    getMessage = async (msg) =>{
        let returnMessage: message;
        console.log("entered the get msg in whatsapp msg ser")
        let whatsapp_id = msg.contacts[0].wa_id;
        let name = msg.contacts[0].profile.name;
        let chat_message_id= msg.messages[0].id
        if (msg.messages[0].type == "text") {
            let message = msg.messages[0].text.body;
    
            const regexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
            if (regexExp.test(message)) {
                message = await this.emojiUnicode(message) == "1f44e" ? "NegativeFeedback" : "PositiveFeedback"
            }
            
            returnMessage = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id, direction:"In", messageBody:message,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:'text'}
    
        }
        else if (msg.messages[0].type == "location") {
            let loc = `latlong:${msg.messages[0].location.latitude}-${msg.messages[0].location.longitude}`;
            returnMessage = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id, direction:"In",messageBody:null,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:loc,type:'location'}
        }
        else if (msg.messages[0].type == "voice") {
            let mediaUrl = await this.GetWhatsappMedia(msg.messages[0].voice.id);
            console.log("the mediaUrl", mediaUrl)
            let ConvertedToText = await this.Speechtotext.SendSpeechRequest(mediaUrl, "whatsapp");
            if (ConvertedToText) {
                returnMessage = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id, direction:"In",messageBody:String(ConvertedToText),sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:msg.messages[0].type}
            }
            else {
                returnMessage = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id, direction:"In",messageBody:null,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:msg.messages[0].type}
            }
        }else {
            returnMessage = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id, direction:"In",messageBody:null,sessionId:whatsapp_id,replayPath:whatsapp_id,latlong:null,type:msg.messages[0].type}
            console.log("exiting the getMessage in whatsapp mg ser", returnMessage)
        }
        return returnMessage;
    }

    postResponse = async (message, response ) => {
        console.log("entered the postresponse msg in whatsapp msg ser")
        let reaponse_message: response;
        let whatsapp_id = message.sessionId;
        let input_message = message.messageBody;
        let name = message.name;
        let chat_message_id= message.chat_message_id
        let raw_response_object = response.text_part_from_DF.result && response.text_part_from_DF.result.fulfillmentMessages ? JSON.stringify(response.text_part_from_DF.result.fulfillmentMessages) : '';
        let intent = response.text_part_from_DF.result && response.text_part_from_DF.result.intent ? response.text_part_from_DF.result.intent.displayName : '';

        if (response.text_part_from_DF) {
            if (response.text_part_from_DF.image && response.text_part_from_DF.image.url) {
                reaponse_message = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id,direction:"Out",message_type:"image",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:response.text_part_from_DF.image , messageImageCaption: response.text_part_from_DF.image.url, sessionId: whatsapp_id,input_message:input_message,messageText:null }
            }
            else if (response.processed_message.length > 1) {
                if (response.text_part_from_DF.parse_mode && response.text_part_from_DF.parse_mode == 'HTML') {
                    let uploadImageName;
                    uploadImageName = await createFileFromHTML(response.processed_message[0])
                    const vaacinationImageFile = await uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id,direction:"Out",message_type:"image",raw_response_object:raw_response_object,intent:intent,messageBody:String(vaacinationImageFile), messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id,input_message:input_message, messageText:response.processed_message[1] }
                    }
                }
                else {
                    reaponse_message = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id,direction:"Out",message_type:"text",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id,input_message:input_message, messageText:response.processed_message[0] }
                    reaponse_message = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id,direction:"Out",message_type:"text",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id,input_message:input_message, messageText:response.processed_message[1] }
                }
            }
            else {
                reaponse_message = {name:name,platform:"Whatsapp",chat_message_id:chat_message_id,direction:"Out",message_type:"text",raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: whatsapp_id,input_message:input_message, messageText:response.processed_message[0] }
            }
        }
        return reaponse_message;
    }
}