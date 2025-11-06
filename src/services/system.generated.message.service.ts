import { inject, Lifecycle, scoped } from 'tsyringe';
import { SystemGeneratedMessages } from '../models/system.generated.messages.model.js';
import { EntityManagerProvider } from './entity.manager.provider.service.js';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';

@scoped(Lifecycle.ContainerScoped)
export class SystemGeneratedMessagesService {

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService)
            private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {}

    async getMessage(name: string) {
        try {
            const repository = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const systemGeneratedMessages = await repository.getRepository(SystemGeneratedMessages);
            let systemGeneratedMessage;

            const message = await systemGeneratedMessages.findOne({where : {messageName: name}});
            if (message) {
                systemGeneratedMessage = message.dataValues.messageContent;
            } else {
                systemGeneratedMessage = this.clientEnvironmentProviderService.getClientEnvironmentVariable(name);
            }
            return systemGeneratedMessage;
        } catch (error) {
            console.log("Error while fetching the system generated messsage: ", error);
        }
    }
}