/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { AwsS3manager } from './aws.file.upload.service';
import { autoInjectable, singleton, inject, delay } from 'tsyringe';
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow';

@autoInjectable()
@singleton()
export class CommonWhatsappService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        private awsS3manager?: AwsS3manager,
        public whatsappMessageToDialogflow?: WhatsappMessageToDialogflow){}

    async handleMessage(requestBody: any, channel: string) {
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
                await this.messageFlow.checkTheFlow(whatsappMessagetoDialogflow, channel, this);
            }
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

    async SendMediaMessage (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) {

        // Childclass will implement
    }

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const whatsapp_id = message.platformId;
        const input_message = message.messageBody;
        const user_name = message.name;
        const chat_message_id = message.chat_message_id;
        const image = processedResponse.message_from_dialoglow.getImageObject();
        const pasrseMode = processedResponse.message_from_dialoglow.getParseMode();
        const payload = processedResponse.message_from_dialoglow.getPayload();
        const intent = processedResponse.message_from_dialoglow.getIntent();

        if (processedResponse) {
            if (image && image.url) {
                reaponse_message = { name: user_name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: whatsapp_id, input_message: input_message, messageText: image.caption };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (pasrseMode && pasrseMode === 'HTML') {
                    // eslint-disable-next-line max-len
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: user_name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1] };
                    }
                }
                else {
                    reaponse_message = { name: user_name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0] };
                    reaponse_message = { name: user_name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                let message_type = "text";
                if (payload !== null){
                    message_type = payload.fields.messagetype.stringValue;
                }
                
                reaponse_message = { name: user_name, platform: "Whatsapp", chat_message_id: chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: whatsapp_id, input_message: input_message, messageText: processedResponse.processed_message[0] };
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
    }
}
