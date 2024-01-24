/* eslint-disable init-declarations */
/* eslint-disable max-len */

// import { DialogflowResponseService } from './dialogflow-response.service';
import { AwsS3manager } from './aws.file.upload.service';
import { Imessage, IprocessedDialogflowResponseFormat, Iresponse } from '../refactor/interface/message.interface';
import { inject, delay, scoped, Lifecycle } from 'tsyringe';
import  TelegramBot  from 'node-telegram-bot-api';
import { MessageFlow } from './get.put.message.flow.service';
import { platformServiceInterface } from '../refactor/interface/platform.interface';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { clientAuthenticator } from './clientAuthenticator/client.authenticator.interface';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { TelegramMessageToDialogflow } from './telegram.messagetodialogflow';
import { TelegramPostResponseFunctionalities } from './telegram.post.response.functionalities';
import { LogsQAService } from './logs.for.qa';

@scoped(Lifecycle.ContainerScoped)
export class TelegramMessageService implements platformServiceInterface{

    public _telegram: TelegramBot = null;

    public res;

    // public req;
    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(TelegramMessageToDialogflow) private telegramMessageToDialogflow?: TelegramMessageToDialogflow,
        @inject(TelegramPostResponseFunctionalities) private telegramPostResponseFunctionalities?: TelegramPostResponseFunctionalities,
        @inject("telegram.authenticator") private clientAuthenticator?: clientAuthenticator,
        @inject(LogsQAService) private logsQAService?: LogsQAService) {
        this._telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
        this.init();
    }

    getMessageIdFromResponse(response: any) {
        return response.message_id;
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
        this._telegram.on('message', async msg => {
            await this.actionOnTelegramEvent(msg);
        });

        this._telegram.on('callback_query', async (callbackQuery) => {
            await this.actionOnTelegramEvent(callbackQuery);
        });
    }

    setWebhook(clientName){
        this._telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
        const webhookUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL") + '/v1/' + clientName + '/telegram/' + this.clientAuthenticator.urlToken + '/receive';
        this._telegram.setWebHook(webhookUrl);
        console.log("Telegram webhook set", webhookUrl);
    }

    postResponse = async(message: Imessage, processedResponse: IprocessedDialogflowResponseFormat) => {
        console.log("enter the give response of tele");
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const telegram_id = message.platformId;
        const input_message = message.messageBody;
        const name = message.name;
        const chat_message_id = message.chat_message_id;
        const image = processedResponse.message_from_nlp.getImageObject();
        const pasrseMode = processedResponse.message_from_nlp.getParseMode();
        const intent = processedResponse.message_from_nlp.getIntent();
        const payload = processedResponse.message_from_nlp.getPayload();

        if (image && image.url) {
            reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",intent: intent,messageBody: image.url, messageImageUrl: image.url , messageImageCaption: image.caption, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
        }
        else if (processedResponse.processed_message.length > 1) {

            if (pasrseMode && pasrseMode === 'HTML') {
                // eslint-disable-next-line max-len
                const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                if (vaacinationImageFile) {
                    reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",intent: intent,messageBody: String(vaacinationImageFile), messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
                reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[1] };
            }
        } else {
            let message_type = "text";
            if (payload !== null){
                message_type = payload.fields.messagetype.stringValue;
                if (message_type === "interactive-buttons") {
                    message_type = "inline_keyboard";
                }
            }
            reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: message_type,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: processedResponse.processed_message[0] };
        }
        return reaponse_message;
        
    };

    createFinalMessageFromHumanhandOver(requestBody) {
        const response_message: Iresponse = {
            name                : requestBody.agentName,
            platform            : "Telegram",
            chat_message_id     : null,
            direction           : "Out",
            input_message       : null,
            message_type        : requestBody.type ?? "text",
            intent              : null,
            messageBody         : null,
            messageImageUrl     : null,
            messageImageCaption : null,
            sessionId           : requestBody.userId,
            messageText         : requestBody.message
        };
        return response_message;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SendMediaMessage = async (response_format:Iresponse, payload:any) => {
        
        const type = response_format.message_type;
        if (type) {
            const classmethod = `send${type}Response`;
            const telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
            console.log(`QA_SERVICE Flag: ${this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE")}`);
            if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE")) {
                if (response_format.name !== "ReanCare") {
                    console.log("Providing QA service through clickUp");
                    await this.logsQAService.logMesssages(response_format);
                }
            }
            return await this.telegramPostResponseFunctionalities[classmethod](response_format,telegram,payload);
        }
    };

    actionOnTelegramEvent = async(requestBody) =>{
        const generatorTelegramMessage = await this.telegramMessageToDialogflow.messageToDialogflow(requestBody);
        let done = false;
        const telegramMessages = [];
        let telegramMessagetoDialogflow: Imessage;
        while (done === false) {
            const nextgeneratorObj = generatorTelegramMessage.next();
            telegramMessagetoDialogflow = (await nextgeneratorObj).value;
            done = (await nextgeneratorObj).done;
            telegramMessages.push(telegramMessagetoDialogflow);
        }
        for (telegramMessagetoDialogflow of telegramMessages){
            if (telegramMessagetoDialogflow) {
                await this.messageFlow.checkTheFlowRouter(telegramMessagetoDialogflow, "telegram", this);
            }
        }
    };

}
