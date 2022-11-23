/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import http from 'https';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fs from 'fs';
import { AwsS3manager } from './aws.file.upload.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable, singleton, inject, delay } from 'tsyringe';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { MessageFunctionalities } from './whatsapp.meta.functionalities';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { clientAuthenticator } from './clientAuthenticator/client.authenticator.interface';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { getRequestOptions } from '../utils/helper';
import { ChatMessage } from '../models/chat.message.model';
import { HandleMessagetypePayload } from './handle.messagetype.payload';

@autoInjectable()
@singleton()
export class WhatsappMessageService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        private awsS3manager?: AwsS3manager,
        private messageFunctionalities?: MessageFunctionalities,
        @inject("whatsapp.authenticator") private clientAuthenticator?: clientAuthenticator,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        private handleMessagetypePayload?: HandleMessagetypePayload){}

    handleMessage(msg: any, channel: string) {
        return this.messageFlow.checkTheFlow(msg, channel, this);
    }

    sendManualMesage(msg: any) {
        return this.messageFlow.send_manual_msg(msg, this);
    }

    init() {
        throw new Error('Method not implemented.');
    }

    createRequestforWebhook(resolve, reject, apiKey) {
        const options = {
            hostname : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST"),
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

    setWebhook(clientName: string){

        return new Promise((resolve, reject) => {
            const webhookUrl = `${this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL")}/v1/${clientName}/whatsapp/${this.clientAuthenticator.urlToken}/receive`;
            const postData = JSON.stringify({
                'url'     : webhookUrl,
                "headers" : {
                    "authentication" : this.clientAuthenticator.headerToken
                }
            });
            const apiKey = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");

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

    SetWebHookOldNumber = async (clientName: string) => {

        return new Promise((resolve, reject) => {
            const webhookUrl = `${this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL")}/v1/${clientName}/whatsapp/${this.clientAuthenticator.urlToken}/receive`;
            if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY_OLD_NUMBER")) {

                const postData = JSON.stringify({
                    'url' : webhookUrl,
                });

                const apiKey = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY_OLD_NUMBER");

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
    };

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
                hostname : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST"),
                path     : '/v1/messages',
                method   : 'POST',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY_OLD_NUMBER")
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
    };

    postDataFormatWhatsapp = (contact) => {
        const postData = {
            'recipient_type' : 'individual',
            'to'             : contact,
            'type'           : null
        };
        return postData;
    };

    async postRequestMessages(postdata) {
        return new Promise<any>(async(resolve,reject) =>{
            try {
                const options = getRequestOptions();
                options.headers['Content-Type'] = 'application/json';
                options.headers['D360-Api-Key'] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");
                const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST");
                const path = '/v1/messages';
                const apiUrl = "https://" + hostname + path;
                console.log("apiuri",apiUrl);
                // eslint-disable-next-line init-declarations
                await needle.post(apiUrl, postdata, options, function(err, resp) {
                    if (err) {
                        console.log("err", err);
                        reject(err);
                    }
                    console.log("resp", resp.body);
                    resolve(resp.body);
                });
                
            }
            catch (error) {
                console.log("error", error);
                reject(error.message);
            }
        });
    }

    // eslint-disable-next-line max-len
    SendMediaMessage = async (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) => {
        return new Promise(async(resolve) => {
            console.log("message type",messageType + imageLink);
            message = this.messageFunctionalities.sanitizeMessage(message);
            const postData = this.postDataFormatWhatsapp(contact);
            if (messageType === "image") {
                if (!imageLink) {
                    imageLink = payload.fields.url.stringValue;
                }
                postData["image"] = {
                    "link"    : imageLink,
                    "caption" : message
                };
                postData.type = "image";
                const postDataString = JSON.stringify(postData);
                resolve(await this.postRequestMessages(postDataString));

            }
            else if (messageType === "voice"){
                postData["audio"] = {
                    "link" : imageLink
                };
                postData.type = "audio";
                const postDataString = JSON.stringify(postData);
                console.log("this is the postDataString", postDataString);
                resolve(await this.postRequestMessages(postDataString));
            }
            else if (messageType === "interactive-buttons"){
                const buttons1 = [];
                const numberOfButtons1 = (payload.fields.buttons.listValue.values).length;
                for (let i = 0; i < numberOfButtons1; i++){
                    const id1 = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.id.stringValue;
                    const title1 = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.title.stringValue;
                    const tempObject1 = {
                        "type"  : "reply",
                        "reply" : {
                            "id"    : id1,
                            "title" : title1
                        }
                    };
                    buttons1.push(tempObject1);
                }
                postData["interactive"] = {
                    "type" : "button",
                    "body" : {
                        "text" : message
                    },
                    "action" : {
                        "buttons" : buttons1
                    }
                };
                postData.type = "interactive";
                const postDataString = JSON.stringify(postData);
                console.log("this is the postDataString", postDataString);
                return await this.postRequestMessages(postDataString);
            }
            else if (messageType === "interactive-list"){
                const rows = [];
                var header = "";
                const list = payload.fields.buttons.listValue.values;
                if (payload.fields.header){
                    header = payload.fields.header.stringValue;
                } else {
                    header = "LIST";
                }
                let count = 0;
                for (const lit of list){
                    let id = count;
                    let description_meta = "";
                    if (lit.structValue.fields.description){
                        description_meta = lit.structValue.fields.description.stringValue;
                    }
                    if (lit.structValue.fields.id){
                        id = lit.structValue.fields.id.stringValue;
                    }
                    const temp = {
                        "id"          : id,
                        "title"       : lit.structValue.fields.title.stringValue,
                        "description" : description_meta
                    };
                    rows.push(temp);
                    count++;
                }
                postData["interactive"] = {
                    "type" : "list",
                    "body" : {
                        "text" : message
                    },
                    "action" : {
                        "button"   : "Select From Here",
                        "sections" : [
                            {
                                "rows" : rows
                            }
                        ]
                    }
                };
                postData.type = "interactive";
                const postDataString = JSON.stringify(postData);
                resolve(await this.postRequestMessages(postDataString));
                
            // }
            // else if (messageType === "custom_payload") {
            //     const payloadContent = this.handleMessagetypePayload.getPayloadContent(payload);
            //     this.SendPayloadMessage(contact, imageLink, payloadContent);
            }
            else {
                postData["text"] = {
                    "body" : message
                };
                if (new RegExp("(https?:+)").test(message)) {
                    postData["preview_url"] = true;
                } else {
                    postData["preview_url"] = false;
                }
                postData.type = "text";
                const postDataString = JSON.stringify(postData);
                const needleResp = await this.postRequestMessages(postDataString);
                const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: postData.to } });
                const id = respChatMessage[respChatMessage.length - 1].id;
                await ChatMessage.update({ whatsappResponseMessageId: needleResp.messages[0].id }, { where: { id: id } } )
                    .then(() => { console.log("updated"); })
                    .catch(error => console.log("error on update", error));
                resolve(needleResp);
            }
        });
    };

    getMessage = async (msg: any) => {
        if (msg.messages[0].type === "text") {
            // eslint-disable-next-line max-len
            return await this.messageFunctionalities.textMessageFormat(msg);
        }
        else if (msg.messages[0].type === "location") {
            return await this.messageFunctionalities.locationMessageFormat(msg);
        }
        else if (msg.messages[0].type === "voice") {
            return await this.messageFunctionalities.voiceMessageFormat(msg, msg.messages[0].type, 'whatsapp');
        }
        else if (msg.messages[0].type === "image") {
            return await this.messageFunctionalities.imageMessaegFormat(msg);
        }
        else if (msg.messages[0].type === "interactive") {
            if (msg.messages[0].interactive.type === "list_reply"){
                return await this.messageFunctionalities.interactiveListMessaegFormat(msg);
            } else {
                return await this.messageFunctionalities.interactiveMessaegFormat(msg);
            }
        }
        else {
            throw new Error("Message is neither text, voice nor location");
        }
    };

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const whatsapp_id = message.sessionId;
        const input_message = message.messageBody;
        const name = message.name;
        const chat_message_id = message.chat_message_id;
        const image = processedResponse.message_from_dialoglow.getImageObject();
        const pasrseMode = processedResponse.message_from_dialoglow.getParseMode();
        const payload = processedResponse.message_from_dialoglow.getPayload();
        const intent = processedResponse.message_from_dialoglow.getIntent();

        if (processedResponse) {
            if (image && image.url) {
                reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: whatsapp_id, input_message: input_message, messageText: image.caption };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (pasrseMode && pasrseMode === 'HTML') {
                    // eslint-disable-next-line max-len
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1] };
                    }
                }
                else {
                    reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0] };
                    reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                let message_type = "text";
                if (payload){
                    if (payload.fields.messagetype){
                        message_type = payload.fields.messagetype.stringValue;
                    }
                }
                reaponse_message = { name: name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0] };
            }
        }
        return reaponse_message;
    };

    createFinalMessageFromHumanhandOver(requestBody) {
        const response_message: Iresponse = {
            name                : requestBody.agentName,
            platform            : "whatsapp",
            chat_message_id     : null,
            direction           : "Out",
            input_message       : null,
            message_type        : "text",
            intent              : null,
            messageBody         : null,
            messageImageUrl     : null,
            messageImageCaption : null,
            sessionId           : requestBody.userId,
            messageText         : requestBody.message
        };
        return response_message;
    }

}
