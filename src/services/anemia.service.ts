/* eslint-disable init-declarations */
import { message } from '../refactor/interface/message.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { TelegramMessageService } from './telegram.message.service';
import needle from "needle";
import { getRequestOptions } from '../utils/helper';
import  TelegramBot  from 'node-telegram-bot-api';

@autoInjectable()
export class AnemiaModel{

    public _telegram: TelegramBot = null;

    constructor(
        private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        private telegramMessageService?: TelegramMessageService) {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async get_put_AnemiaResult (msg, channel) {
        console.log("entered the get_put_AnemiaResult");
        const messagetoAnemiaModel: message = await this.telegramMessageService.getMessage(msg);
        return this.processMessage(messagetoAnemiaModel);
    }

    async processMessage(messagetoAnemiaModel) {

        // eslint-disable-next-line max-len
        const imagePath = 'https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + messagetoAnemiaModel.messageBody;
        const anemiaModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ANEMIA_MODEL_URL");
        const REQUEST_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REQUEST_AUTHENTICATION");
        const options = getRequestOptions();
        options.headers["Authorization"] = `Bearer ${REQUEST_AUTHENTICATION}`;
        options.headers["Content-Type"] = `application/json`;
        const obj = {
            "path" : imagePath
        };
        const response = await needle("post",anemiaModelUrl, obj, options);

        if (response.statusCode !== 200) {
            console.log("Failed to get response from API.");
        }
        let anemiaResult: string;
        if (messagetoAnemiaModel.type !== "image"){
            // eslint-disable-next-line max-len
            this.telegramMessageService.SendMediaMessage(messagetoAnemiaModel.sessionId, null, "Hey, I'm  REAN Anemia Detection Bot. Please share an image of your eye conjunctiva similar to the one shown below",messagetoAnemiaModel.type);
            // eslint-disable-next-line max-len
            this.telegramMessageService.SendMediaMessage(messagetoAnemiaModel.sessionId, "https://t4.ftcdn.net/jpg/02/52/68/73/240_F_252687355_x6qCu70kdEjb1RRygVreCZXslqq7EDi1.jpg","Instructions: \n 1. Gently pull your lower eyelid  with your index finger. \n 2. Try focusing the camera on the conjunctiva region and take a picture under good lighting.", messagetoAnemiaModel.type);
            return;
        }
        else {
            if (response.body.isAnemic === false){
                anemiaResult = "The Case is not Anemic";
            }
            else if (response.body.isAnemic === true){
                anemiaResult = "The Case is Anemic";
            }
            else {
                anemiaResult = "Result not found";
            }
        }
        // eslint-disable-next-line max-len
        return this.telegramMessageService.SendMediaMessage(messagetoAnemiaModel.sessionId, null, anemiaResult, messagetoAnemiaModel.type);

    }

}
