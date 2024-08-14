import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../common/logger';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { ChatMessage } from '../models/chat.message.model';
import { CustomMLModelResponseService } from './custom.ml.model.response.service';
import { IserviceResponseFunctionalities } from "./response.format/response.interface";

@scoped(Lifecycle.ContainerScoped)
export  class WelcomeIntentService {

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(CustomMLModelResponseService)private customMLModelResponseService?: CustomMLModelResponseService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async welcomeUser(eventobj){
        try {
            let message_from_nlp:IserviceResponseFunctionalities = null;
            const messageObject = eventobj.body.originalDetectIntentRequest.payload.completeMessage;
            // eslint-disable-next-line max-len
            const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
            // eslint-disable-next-line max-len
            const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: messageObject.platformId } });
            
            if (respChatMessage.length > 10){
                // eslint-disable-next-line max-len
                message_from_nlp = await this.customMLModelResponseService.getCustomModelResponse(messageObject.messageBody, messageObject.platform, messageObject);
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    message_from_nlp
                                ]
                            }
                        }
                    ]
                };
                return data
            }
            else {
                const fulfillmentMessages = eventobj.body.queryResult.fulfillmentMessages[0];
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    fulfillmentMessages.text.text[0]
                                ]
                            }
                        }
                    ]
                };
                return (data);
            }

        }
        catch (e){
            Logger.instance().log(e.message);
            throw new Error("Default welcome service error");
        }
    }

}
