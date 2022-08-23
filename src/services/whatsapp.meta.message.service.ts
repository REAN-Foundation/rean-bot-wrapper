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
import util from "util";

@autoInjectable()
@singleton()
export class WhatsappMetaMessageService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        private awsS3manager?: AwsS3manager,
        private messageFunctionalitiesmeta?: MessageFunctionalities,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    handleMessage(requestBody: any, channel: string) {
        return this.messageFlow.checkTheFlow(requestBody, channel, this);
    }

    sendManualMesage(msg: any) {
        return this.messageFlow.send_manual_msg(msg, this);
    }

    init() {
        throw new Error('Method not implemented.');
    }

    setWebhook(clientName: string){
        throw new Error('Method not implemented.');
    }

    postDataFormatWhatsapp = (contact) => {

        const postData = {
            "messaging_product" : "whatsapp",
            "recipient_type"    : "individual",
            "to"                : contact,
            "type"              : null
        };
        return postData;
    };

    async postRequestMessages(postdata) {
        return new Promise(async(resolve,reject) =>{
            try {
                const options = getRequestOptions();
                const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
                options.headers['Content-Type'] = 'application/json';
                options.headers['Authorization'] = `Bearer ${token}`;
                const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
                const whatsappPhoneNumberID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
                const path = `/v13.0/${whatsappPhoneNumberID}/messages`;
                const apiUrl_meta = hostname + path;
                await needle.post(apiUrl_meta, postdata, options, function(err, resp) {
                    if (err) {
                        console.log("err", err);
                        reject(err);
                    }
                    console.log("resp", resp.body);
                });
            }
            catch (error) {
                console.log("error", error);
                reject(error.message);
            }
        });
    }

    SendMediaMessage = async (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) => {
        return new Promise(async() => {

            // console.log("message type",messageType + imageLink);
            console.log("This is the payload", payload);
            const messageBody = this.messageFunctionalitiesmeta.sanitizeMessage(message);
            const postDataMeta = this.postDataFormatWhatsapp(contact);
            if (messageType === "image") {
                postDataMeta["image"] = {
                    "link"    : imageLink,
                    "caption" : messageBody
                };
                postDataMeta.type = "image";
                const postDataString = JSON.stringify(postDataMeta);
                console.log("this is the postData", postDataString);
                await this.postRequestMessages(postDataString);

            }
            else if (messageType === "voice"){
                postDataMeta["audio"] = {
                    "link" : imageLink
                };
                postDataMeta.type = "audio";
                const postDataString = JSON.stringify(postDataMeta);
                console.log("this is the postDataString", postDataString);
                await this.postRequestMessages(postDataString);
            }
            else if (messageType === "template"){
                postDataMeta["template"] = {
                    "name"     : "transactional_test",
                    "language" : {
                        "code" : "en"
                    },
                    "components" : [{
                        "type"       : "body",
                        "parameters" : [{
                            "type" : "text",
                            "text" : "twelve"
                        },
                        {
                            "type" : "text",
                            "text" : "Vitamins"
                        }]
                    }] 
                };
                postDataMeta.type = "template";
                const postDataString = JSON.stringify(postDataMeta);
                console.log("this is the postDataString", postDataString);
                await this.postRequestMessages(postDataString);
            }
            else if (messageType === "interactive-buttons"){
                postDataMeta["interactive"] = {
                    "type" : "button",
                    "body" : {
                        "text" : message
                    },
                    "action" : {
                        "buttons" : [
                            {
                                "type"  : "reply",
                                "reply" : {
                                    "id"    : "unique-postback-id11111",
                                    "title" : "Yes" 
                                }
                            },
                            {
                                "type"  : "reply",
                                "reply" : {
                                    "id"    : "unique-postback-id222222222",
                                    "title" : "No" 
                                }
                            }
                        ] 
                    }
                };
                postDataMeta.type = "interactive";
                const postDataString = JSON.stringify(postDataMeta);
                console.log("this is the postDataString", postDataString);
                await this.postRequestMessages(postDataString);
            } else if (messageType === "interactive-list") {
                const rows_meta = [];
                const list_meta = payload.fields.buttons.listValue.values;
                let count_meta = 0;
                for (const lit of list_meta){
                    let id_meta = count_meta;
                    let description_meta = "";
                    if (lit.structValue.fields.description){
                        description_meta = lit.structValue.fields.description.stringValue;
                    }
                    if (lit.structValue.fields.id){
                        id_meta = lit.structValue.fields.id.stringValue;
                    }
                    const temp_meta = {
                        "id"          : id_meta,
                        "title"       : lit.structValue.fields.title.stringValue,
                        "description" : description_meta
                    };
                    rows_meta.push(temp_meta);
                    count_meta++;
                }
                postDataMeta["interactive"] = {
                    "type"   : "list",
                    "header" : {
                        "type" : "text",
                        "text" : "LIST"
                    },
                    "body" : {
                        "text" : message
                    },
                    "action" : {
                        "button": "Select From Here",
                        "sections": [
                            {
                                "rows": rows_meta
                            }
                        ]
                    }
                };
                postDataMeta.type = "interactive";
                const postDataString = JSON.stringify(postDataMeta);
                console.log("this is the postDataString", postDataString);
                await this.postRequestMessages(postDataString);
            }
            else {
                postDataMeta["text"] = {
                    "body" : message
                };
                postDataMeta.type = "text";
                const postDataString = JSON.stringify(postDataMeta);
                console.log("this is the postData", postDataString);
                await this.postRequestMessages(postDataString);
            }
        });
    };

    getMessage = async (message: any) => {
        // console.log("request from whatsapp format", msg);
        if (message.messages[0].type === "text") {
            // eslint-disable-next-line max-len
            return await this.messageFunctionalitiesmeta.textMessageFormat(message);
        }
        else if (message.messages[0].type === "location") {
            return await this.messageFunctionalitiesmeta.locationMessageFormat(message);
        }
        else if (message.messages[0].type === "voice") {
            return await this.messageFunctionalitiesmeta.voiceMessageFormat(message);
        }
        else if (message.messages[0].type === "image") {
            return await this.messageFunctionalitiesmeta.imageMessaegFormat(message);
        }
        else if (message.messages[0].type === "interactive") {
            if (message.messages[0].interactive.type === "list_reply"){
                return await this.messageFunctionalitiesmeta.interactiveListMessaegFormat(message);
            } else {
                return await this.messageFunctionalitiesmeta.interactiveMessaegFormat(message);
            }
        }
        else if (message.messages[0].type === "button") {
            console.log("msg.messages[0].interactive",util.inspect(message.messages[0].button));
            // return await this.messageFunctionalitiesmeta.interactiveMessaegFormat(msg);
        }
        else {
            throw new Error("Message is neither text, voice nor location");
        }
    };

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const meta_whatsapp_id = message.sessionId;
        const meta_input_message = message.messageBody;
        const meta_user_name = message.name;
        const meta_chat_message_id = message.chat_message_id;
        const meta_raw_response_object = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(processedResponse.message_from_dialoglow.result.fulfillmentMessages) : '';
        const intent = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.intent ? processedResponse.message_from_dialoglow.result.intent.displayName : '';

        if (processedResponse) {
            if (processedResponse.message_from_dialoglow.image && processedResponse.message_from_dialoglow.image.url) {
                reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "image", raw_response_object: meta_raw_response_object, intent: intent, messageBody: processedResponse.message_from_dialoglow.image.url, messageImageUrl: processedResponse.message_from_dialoglow.image.url, messageImageCaption: processedResponse.message_from_dialoglow.image.caption, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.message_from_dialoglow.image.caption };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (processedResponse.message_from_dialoglow.parse_mode && processedResponse.message_from_dialoglow.parse_mode === 'HTML') {
                    // eslint-disable-next-line max-len
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "image", raw_response_object: meta_raw_response_object, intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[1] };
                    }
                }
                else {
                    reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "text", raw_response_object: meta_raw_response_object, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[0] };
                    reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "text", raw_response_object: meta_raw_response_object, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                let message_type = "text";
                if ((processedResponse.message_from_dialoglow.result.fulfillmentMessages).length > 1){
                    if (processedResponse.message_from_dialoglow.result.fulfillmentMessages[1].payload !== undefined){
                        message_type = processedResponse.message_from_dialoglow.result.fulfillmentMessages[1].payload.fields.messagetype.stringValue;
                    }
                }
                
                reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: message_type, raw_response_object: meta_raw_response_object, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[0] };
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
