import http from 'https';
import fs from 'fs';
import { uploadFile, createFileFromHTML } from './aws.file.upload.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable, singleton } from 'tsyringe';
import { response, message } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { MessageFunctionalities } from './whatsapp.message.sevice.functionalities';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface {

    public res;

    constructor(private messageFlow?: MessageFlow,
                private messageFunctionalities?: MessageFunctionalities) {
        this.SetWebHook();
    }

    handleMessage(msg: any, client: string) {
        return this.messageFlow.get_put_msg_Dialogflow(msg, client, this);
    }

    sendManualMesage(msg) {
        return this.messageFlow.send_manual_msg(msg, this);
    }

    init() {
        throw new Error('Method not implemented.');
    }

    createRequestforWebhook(resolve, reject, apiKey) {
        const options = {
            hostname : process.env.WHATSAPP_LIVE_HOST,
            path     : '/v1/configs/webhook',
            method   : 'POST',
            headers  : {
                'Content-Type' : 'application/json',
                'D360-Api-Key' : apiKey
            }
        };
        const request = http.request(options, (response) => {
            response.setEncoding('utf8');
            response.on('data', () => {
                resolve(true);
            });
            response.on('end', () => {
                console.log("Whbhook URL set for Whatsapp");
                resolve(true);
            });
        });
        request.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            reject();
        });
        return request;
    }

    SetWebHook = async () => {

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'url' : `${process.env.BASE_URL}/v1/whatsapp/${process.env.TELEGRAM_BOT_TOKEN}/receive`,
            });

            const apiKey = process.env.WHATSAPP_LIVE_API_KEY;

            const request = this.createRequestforWebhook(resolve, reject, apiKey);

            // request.on('error', (e) => {
            //     console.error(`problem with request: ${e.message}`);
            //     reject();
            // });

            // Write data to request body
            request.write(postData);
            request.end();
        });
    }

    SetWebHookOldNumber = async () => {

        return new Promise((resolve, reject) => {
            if (process.env.WHATSAPP_LIVE_API_KEY_OLD_NUMBER) {

                const postData = JSON.stringify({
                    'url' : `${process.env.BASE_URL}/v1/whatsapp/old-number/receive`,
                });

                const apiKey = process.env.WHATSAPP_LIVE_API_KEY_OLD_NUMBER;

                const request = this.createRequestforWebhook(resolve, reject, apiKey);

                // request.on('error', (e) => {
                //     console.error(`problem with request: ${e.message}`);
                //     reject();
                // });

                // Write data to request body
                request.write(postData);
                request.end();
            }
        });
    }

    SendWhatsappMessageOldNumber = async (contact, message) => {

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'recipient_type' : 'individual',
                'to'             : contact,
                'type'           : 'text',
                'text'           : {
                    'body' : message
                }
            });

            const options = {
                hostname : process.env.WHATSAPP_LIVE_HOST,
                path     : '/v1/messages',
                method   : 'POST',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : process.env.WHATSAPP_LIVE_API_KEY_OLD_NUMBER
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', () => {
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
        console.log("msg  has been santised", message);
        return message;
    }

    SendMediaMessage = async (contact, imageLink, message) => {
        return new Promise((resolve, reject) => {
            message = this.sanitizeMessage(message);
            const postData = imageLink ? JSON.stringify({
                'recipient_type' : 'individual',
                'to'             : contact,
                'type'           : 'image',
                "image"          : {
                    "link"    : imageLink,
                    "caption" : message
                }
            }) : JSON.stringify({
                'recipient_type' : 'individual',
                'to'             : contact,
                'type'           : 'text',
                'text'           : {
                    'body' : message
                }
            });
            console.log("this is the postData", postData);
            const options = {
                hostname : process.env.WHATSAPP_LIVE_HOST,
                path     : '/v1/messages',
                method   : 'POST',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : process.env.WHATSAPP_LIVE_API_KEY
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    chunk = JSON.parse(chunk);
                    // eslint-disable-next-line init-declarations
                    let responseStatus: any;
                    console.log("chunk", chunk);
                    if (chunk.meta.success === undefined) {
                        responseStatus = chunk;
                    }
                    console.log("exiting!!!!!!!!!!!!");
                    resolve(responseStatus);
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

    getMessage = async (msg) => {
        // eslint-disable-next-line init-declarations
        let returnMessage: message;
        if (msg.messages[0].type === "text") {
            // eslint-disable-next-line max-len
            returnMessage = await this.messageFunctionalities.textMessageFormat(msg);
        }
        else if (msg.messages[0].type === "location") {
            returnMessage = await this.messageFunctionalities.locationMessageFormat(msg);
        }
        else if (msg.messages[0].type === "voice") {
            returnMessage = await this.messageFunctionalities.voiceMessageFormat(msg);
        }
        else {
            throw new Error("Message is neither text, voice nor location");
        }
        return returnMessage;
    }

    postResponse = async (message, processedResponse) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: response;
        const whatsapp_id = message.sessionId;
        const input_message = message.messageBody;
        const name = message.name;
        const chat_message_id = message.chat_message_id;
        console.log("processedResponse.result", processedResponse.result);
        const raw_response_object = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(processedResponse.message_from_dialoglow.result.fulfillmentMessages) : '';
        const intent = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.intent ? processedResponse.message_from_dialoglow.result.intent.displayName : '';

        if (processedResponse) {
            if (processedResponse.message_from_dialoglow.image && processedResponse.message_from_dialoglow.image.url) {
                reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "image", raw_response_object: raw_response_object, intent: intent, messageBody: null, messageImageUrl: processedResponse.image, messageImageCaption: processedResponse.image.url, sessionId: whatsapp_id, input_message: input_message, messageText: null };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (processedResponse.message_from_dialoglow.parse_mode && processedResponse.message_from_dialoglow.parse_mode === 'HTML') {
                    const uploadImageName = await createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "image", raw_response_object: raw_response_object, intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1] };
                    }
                }
                else {
                    reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", raw_response_object: raw_response_object, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0] };
                    reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", raw_response_object: raw_response_object, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", raw_response_object: raw_response_object, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0] };
            }
        }
        console.log("postresponse format", reaponse_message);
        return reaponse_message;
    }

    createFinalMessageFromHumanhandOver(requestBody) {
        const response_message: response = {
            name                : requestBody.agentName,
            platform            : "whatsapp",
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

        // return response_message;
    }

}