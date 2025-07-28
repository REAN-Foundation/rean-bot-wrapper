import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import path from 'path';
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { NeedleService } from "./needle.service";

@scoped(Lifecycle.ContainerScoped)
export class userHistoryDeletionService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}
    async deleteUserProfile(userId){
            try {
                //const parameters = eventObj.body.queryResult.parameters;
                const user = userId;

                const contactList = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(ContactList);

                const chatSession = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(ChatSession);

                const chatMessage = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(ChatMessage);

                //const personContactList = await contactList.findOne({ where: { userId } });
            } catch (error) {
                console.log(error);
            }

    
}
