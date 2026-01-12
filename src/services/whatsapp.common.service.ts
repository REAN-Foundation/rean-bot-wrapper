/* eslint-disable init-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { AwsS3manager } from './aws.file.upload.service';
import { inject, delay, scoped, Lifecycle } from 'tsyringe';
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow';
import { WhatsappPostResponseFunctionalities } from './whatsapp.post.response.functionalities';

@scoped(Lifecycle.ContainerScoped)
export class CommonWhatsappService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(WhatsappMessageToDialogflow) public whatsappMessageToDialogflow?: WhatsappMessageToDialogflow){}

    async handleMessage(requestBody: any, channel: string) {
        try {
            requestBody.channel = channel;
            const generatorWhatsappMessage = this.whatsappMessageToDialogflow.messageToDialogflow(requestBody);
            let done = false;
            const whatsappMessages = [];
            let whatsappMessagetoDialogflow: Imessage;
            while (done === false) {
                const nextgeneratorObj = generatorWhatsappMessage.next();
                whatsappMessagetoDialogflow = (await nextgeneratorObj).value;
                done = (await nextgeneratorObj).done;
                whatsappMessages.push(whatsappMessagetoDialogflow);
            }
            for (whatsappMessagetoDialogflow of whatsappMessages){
                if (whatsappMessagetoDialogflow) {
                    await this.messageFlow.checkTheFlowRouter(whatsappMessagetoDialogflow, channel, this);
                }
            }
        } catch (error) {
            console.log(error);
        }
    
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

    async SendMediaMessage (response_format:Iresponse, payload: any) {

        // Childclass will implement
    }

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const whatsapp_id = message.platformId;
        const input_message = message.messageBody;
        const user_name = message.name;
        const chat_message_id = message.chat_message_id;
        const platform = message.platform;
        const image = processedResponse.message_from_nlp.getImageObject();
        const pasrseMode = processedResponse.message_from_nlp.getParseMode();
        const payload = processedResponse.message_from_nlp.getPayload();
        const intent = processedResponse.message_from_nlp.getIntent();
        const similar_doc = processedResponse.message_from_nlp.getSimilarDoc();
        const platformId = message.platformId;

        if (processedResponse) {
            if (image && image.url) {
                reaponse_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: whatsapp_id, input_message: input_message, messageText: image.caption, similarDoc: similar_doc };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (pasrseMode && pasrseMode === 'HTML') {

                    console.log(
                        "THIS HTML TO IMAGE SUPPORT HAS BEEN DEPRECATED"
                    );
                    
                    // METHOD BEING DEPRECATED DUE TO PACKAGE SUPPORT ISSUES
                    // eslint-disable-next-line max-len
                    // const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    // const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    // if (vaacinationImageFile) {
                    //     reaponse_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1], similarDoc: similar_doc };
                    // }
                } else {
                    reaponse_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0], similarDoc: similar_doc };
                    reaponse_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1], similarDoc: similar_doc };
                }
            }
            else {
                let message_type = "text";
                if (payload !== null){
                    message_type = payload.fields.messagetype.stringValue;
                    if (message_type === "interactive-buttons") {
                        message_type = "interactivebuttons";
                    }
                    else if (message_type === "interactive-list") {
                        message_type = "interactivelist";
                    }
                }
                
                reaponse_message = { name: user_name, platform: platform, platformId: platformId, chat_message_id: chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0], similarDoc: similar_doc };
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
            messageText         : requestBody.message[0],
            similarDoc          : null,
            platformId          : requestBody.platformId
        };
        return response_message;
    }

    getMessageIdFromResponse(response: any) {
        return response.body?.messages[0].id;
    }
    
}
