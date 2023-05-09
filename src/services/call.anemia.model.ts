import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { getRequestOptions } from '../utils/helper';
import needle from "needle";
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model';
import { EntityManagerProvider } from './entity.manager.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class CallAnemiaModel {

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) { }

    async callAnemiaModel(imagePathFromDF) {
        // eslint-disable-next-line max-len
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const respChatMessage = await chatMessageRepository.findAll({ where: { "messageContent": imagePathFromDF, "direction": "In" } });
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
