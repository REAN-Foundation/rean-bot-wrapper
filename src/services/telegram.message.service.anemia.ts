
// import { DialogflowResponseService } from './dialogflow-response.service';
import { AwsS3manager } from './aws.file.upload.service';
import { message, response } from '../refactor/interface/message.interface';
import { autoInjectable, singleton, inject } from 'tsyringe';
import  TelegramBot  from 'node-telegram-bot-api';
import { MessageFlow } from './get.put.message.flow.service';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { TelegramMessageServiceFunctionalities } from '../services/telegram.message.service.functionalities';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { clientAuthenticator } from './clientAuthenticator/client.authenticator.interface';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { AnemiaModel } from './anemia.service';

@autoInjectable()
@singleton()
export class TelegramAnemiaMessageService implements platformServiceInterface{

    public _telegram: TelegramBot = null;

    public res;

    // public req;
    constructor(private messageFlow?: MessageFlow,
        private telegramMessageServiceFunctionalities?: TelegramMessageServiceFunctionalities,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        private anemiaModel?: AnemiaModel,
        @inject("telegram.authenticator") private clientAuthenticator?: clientAuthenticator) {
        this._telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
        this.init();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMessage(msg, channel: string){
        this._telegram.processUpdate(msg);
        console.log("message sent to events");
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendManualMesage(msg){
        return this.messageFlow.send_manual_msg(msg, this);
    }

    init(){
        this._telegram.on('message', msg => {

            // this.messageFlow.get_put_msg_Dialogflow(msg, "telegram", this);
            this.anemiaModel.get_put_AnemiaResult(msg, "telegram");
        });
    }

    setWebhook(clientName){
        this._telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
        const webhookUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL") + '/v1/' + clientName + '/anemiaTelegram/' + this.clientAuthenticator.urlToken + '/receive';
        this._telegram.setWebHook(webhookUrl);

        // console.log("url tele",webhookUrl)
        console.log("Telegram webhook for anemia set," );
    }

    getMessage(msg: any) {
        throw new Error('Method not implemented.');
    }
    postResponse(messagetoDialogflow: message, process_raw_dialogflow: any) {
        throw new Error('Method not implemented.');
    }
    SendMediaMessage(SmessagetoDialogflow_sessionId: string, response_format_messageBody: string, response_format_messageText: string) {
        throw new Error('Method not implemented.');
    }
    createFinalMessageFromHumanhandOver(requestBody: any) {
        throw new Error('Method not implemented.');
    }

    // getMessage = async (message) =>{
    //     console.log("enter the getMessage of telegram", message);

    //     if (message.text) {
    //         return await this.telegramMessageServiceFunctionalities.textMessageFormat(message);
    //     } else if (message.voice) {
    //         return await this.telegramMessageServiceFunctionalities.voiceMessageFormat(message);
    //     } else if (message.location) {
    //         return await this.telegramMessageServiceFunctionalities.locationMessageFormat(message);
    //     } else if(message.photo){
    //         return await this.telegramMessageServiceFunctionalities.imageMessaegFormat(message);
    //     }
    //     else {
    //         throw new Error('Message is neither text, voice nor location');
    //     }
    // }

    // postResponse = async(message, processedResponse) => {
    //     console.log("enter the give response of tele");
    //     // eslint-disable-next-line init-declarations
    //     let reaponse_message: response;
    //     const telegram_id = message.sessionId;
    //     const input_message = message.messageBody;
    //     const name = message.name;
    //     const chat_message_id = message.chat_message_id;
    //     const raw_response_object = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(processedResponse.message_from_dialoglow.result.fulfillmentMessages) : '';
    //     const intent = processedResponse.message_from_dialoglow.result && processedResponse.message_from_dialoglow.result.intent ? processedResponse.message_from_dialoglow.result.intent.displayName : '';

    //     if (processedResponse.message_from_dialoglow.image && processedResponse.message_from_dialoglow.image.url) {
    //         reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: processedResponse.message_from_dialoglow.image , messageImageCaption: processedResponse.message_from_dialoglow.image.url, sessionId: telegram_id, messageText: null };
    //     }
    //     else if (processedResponse.processed_message.length > 1) {

    //         if (processedResponse.message_from_dialoglow.parse_mode && processedResponse.message_from_dialoglow.parse_mode === 'HTML') {
    //             const uploadImageName = await createFileFromHTML(processedResponse.processed_message[0]);
    //             const vaacinationImageFile = await uploadFile(uploadImageName);
    //             if (vaacinationImageFile) {
    //                 reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",raw_response_object: raw_response_object,intent: intent,messageBody: String(vaacinationImageFile), messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[1] };
    //             }
    //         }
    //         else {
    //             reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
    //             reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[1] };
    //         }
    //     } else {
    //         reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
    //     }
    //     return reaponse_message;
    // }

    // createFinalMessageFromHumanhandOver(requestBody) {
    //     const response_message: response = {
    //         name                : requestBody.agentName,
    //         platform            : "Telegram",
    //         chat_message_id     : null,
    //         direction           : "Out",
    //         input_message       : null,
    //         message_type        : "text",
    //         raw_response_object : null,
    //         intent              : null,
    //         messageBody         : null,
    //         messageImageUrl     : null,
    //         messageImageCaption : null,
    //         sessionId           : requestBody.userId,
    //         messageText         : requestBody.message
    //     };
    //     return response_message;
    // }

    // SendMediaMessage = async (contact, imageLink = null, message) => {
    //     message = this.sanitizeMessage(message);
    //     return new Promise((resolve) => {

    //         if (imageLink === null){
    //             this._telegram.sendMessage(contact, message, { parse_mode: 'HTML' }).then(function (data) {
    //                 resolve(data);
    //             });
    //         }
    //         else this._telegram.sendPhoto(
    //             contact,
    //             imageLink,
    //             { caption: message }
    //         )
    //             .then(function (data) {
    //                 resolve(data);
    //             });
    //     });
    // }

    // sanitizeMessage(message) {
    //     if (message > 4096) {
    //         var strshortened = message.slice(0, 3800);
    //         strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
    //         strshortened = strshortened.replace(/(<\/ b>|<\/b>)/mgi, "</b>");
    //         message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
    //     }
    //     return message;
    // }

}
