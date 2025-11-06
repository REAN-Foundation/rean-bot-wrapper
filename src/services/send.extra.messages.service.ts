import { AwsS3manager } from './aws.file.upload.service.js';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';
import { autoInjectable, inject } from 'tsyringe';
import { ResponseHandler } from '../utils/response.handler.js';
import { NeedleService } from './needle.service.js';
import { translateService } from './translate.service.js';
import type { Iresponse } from '../refactor/interface/message.interface.js';
import { sendApiButtonService } from './whatsappmeta.button.service.js';
import { sendTelegramButtonService } from '../services/telegram.button.service.js';
import { commonResponseMessageFormat } from '../services/common.response.format.object.js';
import type { platformServiceInterface } from '../refactor/interface/platform.interface.js';

@autoInjectable()
export class sendExtraMessages{
    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awss3manager?: AwsS3manager,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(translateService) private translationServiceObj?: translateService,
    ){}

    async sendSecondaryButtonMessage(inputMessage, yesIntentName, noIntentName,  eventObj) {
        try {
            let message = inputMessage;
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const languageCode = eventObj.body.queryResult.languageCode;
            const button_yes = await this.translationServiceObj.translatestring("Yes",languageCode);
            const button_no = await this.translationServiceObj.translatestring("No",languageCode);
            message  = await this.translationServiceObj.translatestring(message,languageCode);
            const buttonArray = [button_yes,  yesIntentName ,button_no, noIntentName ];
            this.sendResponsebyButton( message,eventObj, userId,buttonArray);
        } catch (error) {
            console.log(error);
            throw new Error("sending addtional button message error");
        }
    }

    async sendResponsebyButton(message, eventObj, userId, buttonArray){
        try {
            const sourceChannel = eventObj.body.originalDetectIntentRequest.payload.source;
            let payload = null;
            let messageType = null;
            if (sourceChannel === "whatsappMeta"){
                payload = await sendApiButtonService(buttonArray);
                messageType = "interactivebuttons";
            }
            else {
                payload = await sendTelegramButtonService(buttonArray);
                messageType = "inline_keyboard";
            }
            this._platformMessageService = eventObj.container.resolve(sourceChannel);
            await this.sendButton(this._platformMessageService,message, messageType, userId ,payload);
        }
        catch (error) {
            console.log("While formulating button response", error);

        }

    }

    async sendButton(_platformMessageService , message, messageType, sessionId, payload){
        try {
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = sessionId;
            response_format.messageText = message;
            response_format.message_type = messageType;

            _platformMessageService.SendMediaMessage(response_format, payload );
        }
        catch (error) {
            console.log("While Sending button response", error);

        }

    }

    async sendExtraMessage(eventObj, intent, messageFromModel){
        const channel = eventObj.body.originalDetectIntentRequest.payload.source;
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        payload.completeMessage.messageType = 'text';
        payload.completeMessage.messageBody = messageFromModel;
        payload.completeMessage.intent = intent;
        if (channel === "whatsappMeta") {
            const endPoint = 'messages';
            const postData = {
                "messaging_product" : "whatsapp",
                "recipient_type"    : "individual",
                "to"                : userId ,
                "type"              : "text",
                "text"              : {
                    "body" : messageFromModel
                }
            };
            await this.needleService.needleRequestForWhatsappMeta("post", endPoint, JSON.stringify(postData), payload);
        } else if (channel === "telegram") {
            const postData = {
                chat_id : userId,
                text    : messageFromModel
            };
            await this.needleService.needleRequestForTelegram("post", "sendMessage", postData, payload);
        } else {
            throw new Error("Invalid Channel");
        }
    }



}
