/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {inject, delay, scoped, Lifecycle} from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { MessageFlow } from './get.put.message.flow.service';
import { WhatsappWatiMessageToDialogflow } from './whatsapp.wati.messagetodialogflow';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { AwsS3manager } from './aws.file.upload.service';
import { WhatsappWatiPostResponseFunctionalities } from './whatsapp.wati.post.response.functionalities';
import { LogsQAService } from './logs.for.qa';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ChatMessage } from '../models/chat.message.model';

@scoped(Lifecycle.ContainerScoped)
export class WhatsappWatiMessageService implements platformServiceInterface{

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(WhatsappWatiMessageToDialogflow) public whatsappWatiMessageToDialogflow?: WhatsappWatiMessageToDialogflow,
        @inject(WhatsappWatiPostResponseFunctionalities) public whatsappWatiPostResponseFunctionalities?: WhatsappWatiPostResponseFunctionalities,
        @inject(LogsQAService) private logsQAService?: LogsQAService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider
    ){
    }

    async handleMessage(requestBody: any, channel: string) {
        requestBody.channel = channel;
        const generatorWatiWhatsappMessage = this.whatsappWatiMessageToDialogflow.watiMessageToDialogflow(requestBody);
        let done = false;
        const whatsappMessages = [];
        let whatsappMessagetoDialogflow: Imessage;
        while ( done === false ) {
            const nextgeneratorObj = generatorWatiWhatsappMessage.next();
            whatsappMessagetoDialogflow = (await nextgeneratorObj).value;
            done = (await nextgeneratorObj).done;
            whatsappMessages.push(whatsappMessagetoDialogflow);
        }

        for (whatsappMessagetoDialogflow of whatsappMessages) {
            if (whatsappMessagetoDialogflow) {
                await this.messageFlow.checkTheFlowRouter(whatsappMessagetoDialogflow, channel, this);
            }
        }


        console.log("HI WATI!!!");
    }

    async sendManualMesage(msg: any): Promise<any> {
        return await this.messageFlow.send_manual_msg(msg, this);
    }

    async init(){
        return;
    }

    async setWebhook(clientName: string){
        return;
    }
    
    async SendMediaMessage(response_format: Iresponse, payload: any) {
        const type = response_format.message_type;
        if (type) {
            const classmethod = `send${type}Response`;
            const watiResp = await this.whatsappWatiPostResponseFunctionalities[classmethod](response_format, payload);
            if (watiResp.status === 200) {
                if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE")){
                    if (response_format.name !== "ReanCare") {
                        console.log("Providing QA service through clickUp");
                        await this.logsQAService.logMesssages(response_format);
                    }
                }
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: response_format.sessionId } } );
                if (respChatMessage.length > 0) {
                    const id = respChatMessage[respChatMessage.length - 1].id;
                    if (watiResp.data.buttonMetaData){
                        console.log("Button Meta Data is present");
                        await chatMessageRepository.update({ responseMessageID: watiResp.data.message.whatsappMessageId, imageContent: watiResp.data.buttonMetaData }, { where: {id: id}})
                            .then(() => {console.log("DB Updated with Whatsapp Response ID");})
                            .catch(error => console.log("error on update", error));
                    } else {
                        await chatMessageRepository.update({ responseMessageID: watiResp.data.message.whatsappMessageId }, { where: {id: id}})
                            .then(() => {console.log("DB Updated with Whatsapp Response ID");})
                            .catch(error => console.log("error on update", error));
                    }

                }
                return watiResp;
            }
        }
    }

    async postResponse(message: Imessage, processedResponse: IprocessedDialogflowResponseFormat) {
        let response_message: Iresponse;
        const wati_whatsapp_id = message.platformId;
        const input_message = message.messageBody;
        const user_name = message.name;
        const chat_message_id = message.chat_message_id;
        const platform = message.platform;
        const image = processedResponse.message_from_nlp.getImageObject();
        const parseMode = processedResponse.message_from_nlp.getParseMode();
        const payload = processedResponse.message_from_nlp.getPayload();
        const intent = processedResponse.message_from_nlp.getIntent();
        const similar_doc = processedResponse.message_from_nlp.getSimilarDoc();
        const platformId = message.platformId;

        if (processedResponse) {
            if (image && image.url) {
                response_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: wati_whatsapp_id, input_message: input_message, messageText: image.caption, similarDoc: similar_doc };
            } else if (processedResponse.processed_message.length > 1) {
                if (parseMode && parseMode === "HTML") {
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vacinationImageFile) {
                        response_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: wati_whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1], similarDoc: similar_doc };
                    }
                } else {
                    response_message = {name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: wati_whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0], similarDoc: similar_doc};
                    response_message = {name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: wati_whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1], similarDoc: similar_doc};
                }
            } else {
                let message_type = "text";
                let buttonMetaData = null;
                if (payload !== null) {
                    message_type = payload.fields.messagetype.stringValue;
                    if (message_type === "interactive-buttons") {
                        message_type = "interactive-buttons";
                        buttonMetaData = JSON.stringify(this.whatsappWatiPostResponseFunctionalities.getButtonData(response_message, payload));
                    } else if (message_type === "interactive-list") {
                        message_type = "interactivelist";
                    }
                }
                response_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: wati_whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0], similarDoc: similar_doc, buttonMetaData: buttonMetaData};
            }
        }
        return response_message;
    }

    async createFinalMessageFromHumanhandOver(requestBody: any) {
        const response_message: Iresponse = {
            name                : requestBody.agentName,
            platform            : "whatsappWati",
            chat_message_id     : null,
            direction           : "Out",
            input_message       : null,
            message_type        : requestBody.type,
            intent              : null,
            messageBody         : null,
            messageImageUrl     : null,
            messageImageCaption : null,
            sessionId           : requestBody.userId,
            messageText         : requestBody.message[0],
            similarDoc          : null,
            platformId          : requestBody.platformId
        };
        return response_message;
    }

    async getMessageIdFromResponse(responseBody: any) {
        throw new Error("Method not implemented.");
    }
}