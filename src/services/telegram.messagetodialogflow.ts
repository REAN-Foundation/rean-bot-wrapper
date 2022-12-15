import { autoInjectable } from "tsyringe";
import { TelegramRequest } from "./request.format/telegram.request";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { TelegramMessageServiceFunctionalities } from "./telegram.message.service.functionalities";

@autoInjectable()
export class TelegramMessageToDialogflow {

    constructor (private messageFunctionalities?: TelegramMessageServiceFunctionalities,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,) {}

    async messageToDialogflow(requestBody: any) {
        const telegramRequestObject = new TelegramRequest(requestBody);
        const getMessageObj = telegramRequestObject.getMessage();
        let done = false;
        while (done === false){
            const messageNextObject = getMessageObj.next();
            const messageObj = messageNextObject.value;
            done = messageNextObject.done;
            let messagetoDialogflow;
            if (messageObj){
                if (messageObj.isType("text") === true) {
                    messagetoDialogflow = await this.messageFunctionalities.textMessageFormat(messageObj);
                }
                else if (messageObj.isType('location') === true ) {
                    messagetoDialogflow = await this.messageFunctionalities.locationMessageFormat(messageObj);
                }
                else if (messageObj.isType('photo') === true ) {
                    messagetoDialogflow = await this.messageFunctionalities.imageMessaegFormat(messageObj);
                }
                else if (messageObj.isType('voice') === true ) {
                    messagetoDialogflow = await this.messageFunctionalities.voiceMessageFormat(messageObj);
                }
                else if (messageObj.isType('document') === true ) {
                    messagetoDialogflow = await this.messageFunctionalities.documentMessageFormat(messageObj);
                }
                else {
                    throw new Error("Message is neither text, voice, location, photo nor document");
                }
            }
            else {

                //messageObj is void
            }
            console.log("message to dialogflow", messagetoDialogflow);
            return messagetoDialogflow;
        }
    }
}