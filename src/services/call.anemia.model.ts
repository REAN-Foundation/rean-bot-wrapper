import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { getRequestOptions } from '../utils/helper';
import needle from "needle";
import { autoInjectable } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model';

@autoInjectable()
export class CallAnemiaModel {

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService) { }

    async callAnemiaModel(imagePathFromDF) {

        const respChatMessage = await ChatMessage.findAll({ where: { "messageContent": imagePathFromDF, "direction": "In" } });
        const anemiaModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ANEMIA_MODEL_URL");
        const REQUEST_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REQUEST_AUTHENTICATION");
        const options = getRequestOptions();
        options.headers["Authorization"] = `Bearer ${REQUEST_AUTHENTICATION}`;
        options.headers["Content-Type"] = `application/json`;
        const obj = {
            "path" : respChatMessage[respChatMessage.length - 1].imageUrl
        };
        const response = await needle("post", anemiaModelUrl, obj, options);

        console.log("response from anemia model", response.body);

        if (response.statusCode !== 200) {
            console.log("Failed to get response from API.", response.statusCode);
        }
        let anemiaResult = "";
        if (response.body.isAnemic === false) {
            anemiaResult = "The Case is not Anemic";
        }
        else if (response.body.isAnemic === true) {
            anemiaResult = "The Case is Anemic";
        }
        else {
            anemiaResult = "Result not found";
        }
        return anemiaResult;

    }

}
