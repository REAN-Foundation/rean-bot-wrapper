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
import { HandleMessagetypePayload } from './handle.messagetype.payload';
import { EmojiFilter } from './filter.message.for.emoji.service';
import { ChatMessage } from '../models/chat.message.model';
import { WhatsappRequest } from './request.format/whatsapp.request';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow';

@autoInjectable()
@singleton()
export class WhatsappMetaMessageService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        private awsS3manager?: AwsS3manager,
        private messageFunctionalitiesmeta?: MessageFunctionalities,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        private handleMessagetypePayload?: HandleMessagetypePayload,
        private whatsappMessageToDialogflow?: WhatsappMessageToDialogflow){}

    async handleMessage(requestBody: any, channel: string) {
        const messagetoDialogflow = await this.whatsappMessageToDialogflow.messageToDialogflow(requestBody,channel);
        return this.messageFlow.checkTheFlow(messagetoDialogflow, channel, this);
    
    }

    async sendManualMesage(msg: any) {
        return await this.messageFlow.send_manual_msg(msg, this);
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
                const path = `/v14.0/${whatsappPhoneNumberID}/messages`;
                const apiUrl_meta = hostname + path;
                const response = await needle("post", apiUrl_meta, postdata, options);
                console.log(response.body);
                resolve(response);
            }
            catch (error) {
                console.log("error", error);
                reject(error.message);
            }
        });
    }

    SendMediaMessage = async (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) => {

        // console.log("message type",messageType + imageLink);
        console.log("This is the payload", payload);
        const messageBody = this.messageFunctionalitiesmeta.sanitizeMessage(message);
        const postDataMeta = this.postDataFormatWhatsapp(contact);
        if (messageType === "image") {
            if (!imageLink) {
                imageLink = payload.fields.url.stringValue;
            }
            postDataMeta["image"] = {
                "link"    : imageLink,
                "caption" : message
            };
            postDataMeta.type = "image";
            const postDataString = JSON.stringify(postDataMeta);
            return await this.postRequestMessages(postDataString);

        }
        else if (messageType === "voice"){
            postDataMeta["audio"] = {
                "link" : imageLink
            };
            postDataMeta.type = "audio";
            const postDataString = JSON.stringify(postDataMeta);
            console.log("this is the postDataString", postDataString);
            return await this.postRequestMessages(postDataString);
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
            return await this.postRequestMessages(postDataString);
        }
        else if (messageType === "interactive-buttons"){
            const buttons = [];
            const numberOfButtons = (payload.fields.buttons.listValue.values).length;
            for (let i = 0; i < numberOfButtons; i++){
                const id = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.id.stringValue;
                const title = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.title.stringValue;
                const tempObject = {
                    "type"  : "reply",
                    "reply" : {
                        "id"    : id,
                        "title" : title
                    }
                };
                buttons.push(tempObject);
            }
            postDataMeta["interactive"] = {
                "type" : "button",
                "body" : {
                    "text" : message
                },
                "action" : {
                    "buttons" : buttons
                }
            };
            postDataMeta.type = "interactive";
            const postDataString = JSON.stringify(postDataMeta);
            console.log("this is the postDataString", postDataString);
            return await this.postRequestMessages(postDataString);
        } else if (messageType === "interactive-list") {
            const rows_meta = [];
            var header = "";
            const list_meta = payload.fields.buttons.listValue.values;
            if (payload.fields.header){
                header = payload.fields.header.stringValue;
            } else {
                header = "LIST";
            }

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
                    "text" : header
                },
                "body" : {
                    "text" : message
                },
                "action" : {
                    "button"   : "Select From Here",
                    "sections" : [
                        {
                            "rows" : rows_meta
                        }
                    ]
                }
            };
            postDataMeta.type = "interactive";
            const postDataString = JSON.stringify(postDataMeta);
            return await this.postRequestMessages(postDataString);
        }
        else if (messageType === "custom_payload") {
            const payloadContent = this.handleMessagetypePayload.getPayloadContent(payload);
            this.SendPayloadMessageMeta(contact, imageLink, payloadContent);
        }
        else {
            postDataMeta["text"] = {
                "body" : message
            };
            if (new RegExp("(https?:+)").test(message)) {
                postDataMeta["text"]["preview_url"] = true;
            } else {
                postDataMeta["text"]["preview_url"] = false;
            }
            postDataMeta.type = "text";
            const postDataString = JSON.stringify(postDataMeta);
            console.log(postDataString);
            const needleResp:any = await this.postRequestMessages(postDataString);
            const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: postDataMeta.to } });
            const id = respChatMessage[respChatMessage.length - 1].id;
            await ChatMessage.update({ whatsappResponseMessageId: needleResp.body.messages[0].id }, { where: { id: id } } )
                .then(() => { console.log("updated"); })
                .catch(error => console.log("error on update", error));
            return (needleResp);
        }
    };

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const meta_whatsapp_id = message.platformId;
        const meta_input_message = message.messageBody;
        const meta_user_name = message.name;
        const meta_chat_message_id = message.chat_message_id;
        const image = processedResponse.message_from_dialoglow.getImageObject();
        const pasrseMode = processedResponse.message_from_dialoglow.getParseMode();
        const payload = processedResponse.message_from_dialoglow.getPayload();
        const intent = processedResponse.message_from_dialoglow.getIntent();

        if (processedResponse) {
            if (image && image.url) {
                reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: image.caption };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (pasrseMode && pasrseMode === 'HTML') {
                    // eslint-disable-next-line max-len
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[1] };
                    }
                }
                else {
                    reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[0] };
                    reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                let message_type = "text";
                if (payload !== null){
                    message_type = payload.fields.messagetype.stringValue;
                }
                
                reaponse_message = { name: meta_user_name, platform: "Whatsapp", chat_message_id: meta_chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: meta_whatsapp_id, input_message: meta_input_message, messageText: processedResponse.processed_message[0] };
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
            message_type        : requestBody.type,
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

    SendPayloadMessageMeta = async (contact: number | string, imageLink: string, payloadContent: any) => {
        return new Promise(async(resolve) => {
            const listOfPostDataMeta = [];
            for (let i = 0; i < payloadContent.length; i++){
                const postDataMeta = this.postDataFormatWhatsapp(contact);
                const payloadContentMessageTypeMeta = payloadContent[i].fields.messagetype.stringValue;
                if ( payloadContentMessageTypeMeta === "interactive-buttons"){
                    const buttonsMeta = [];
                    const numberOfButtons = (payloadContent[i].fields.buttons.listValue.values).length;
                    for (let j = 0; j < numberOfButtons; j++){
                        const id = payloadContent[i].fields.buttons.listValue.values[j].structValue.fields.reply.structValue.fields.id.stringValue;
                        const title = payloadContent[i].fields.buttons.listValue.values[j].structValue.fields.reply.structValue.fields.title.stringValue;
                        const tempObject = {
                            "type"  : "reply",
                            "reply" : {
                                "id"    : id,
                                "title" : title
                            }
                        };
                        buttonsMeta.push(tempObject);
                    }
                    postDataMeta["interactive"] = {
                        "type" : "button",
                        "body" : {
                            "text" : payloadContent[i].fields.message.stringValue
                        },
                        "action" : {
                            "buttons" : buttonsMeta
                        }
                    };
                    postDataMeta.type = "interactive";
                    listOfPostDataMeta.push(postDataMeta);
                }
                else {
                    console.log("here in text",i);
                    const payloadMessageMeta = payloadContent[i].fields.content;
                    const postDatatemp = this.postDataFormatWhatsapp(contact);
                    postDatatemp["text"] = {
                        "body" : payloadMessageMeta
                    };
                    postDatatemp.type = "text";
                    listOfPostDataMeta.push(postDatatemp);
                }
            }
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            let delayClientPreference;
            if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("DELAY_IN_RESPONSE")) {
                delayClientPreference = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DELAY_IN_RESPONSE");
            }
            else {
                delayClientPreference = 500;
            }
            
            for (let i = 0; i < listOfPostDataMeta.length; i++){
                await delay(delayClientPreference);
                await this.postRequestMessages(listOfPostDataMeta[i]);
            }
        });
    };
}
