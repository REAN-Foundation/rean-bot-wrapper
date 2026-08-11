import { inject, Lifecycle, scoped } from 'tsyringe';
import { SystemGeneratedMessages } from '../models/system.generated.messages.model';
import { SystemGeneratedMessageMetadata } from '../models/system.generated.message.metadata.model';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

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
                systemGeneratedMessage = await this.clientEnvironmentProviderService.getClientEnvironmentVariable(name);
            }
            return systemGeneratedMessage;
        } catch (error) {
            console.log("Error while fetching the system generated messsage: ", error);
        }
    }

    // Returns the extra payload entries configured for a message, or an empty array when the
    // message has no metadata row. Never throws - a metadata problem must not stop the reply.
    async getExtraPayloadEntries(name: string): Promise<any[]> {
        try {
            const entityManager =
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const systemGeneratedMessages = entityManager.getRepository(SystemGeneratedMessages);
            const message = await systemGeneratedMessages.findOne({ where: { messageName: name } });
            if (!message) {
                return [];
            }
            const metadataRepository = entityManager.getRepository(SystemGeneratedMessageMetadata);
            const metadata = await metadataRepository.findOne({ where: { messageId: message.id } });
            if (!metadata) {
                return [];
            }
            return this.normalizeCustomPayload(metadata.customPayload);
        } catch (error) {
            console.log("Error while fetching the system generated message metadata: ", error);
            return [];
        }
    }

    // Builds the fulfillmentMessages array for a system generated message. Without metadata this
    // is the plain text reply the caller would have built anyway. With metadata it becomes a
    // custom payload whose first entry is the message itself, followed by the configured extras,
    // so the channel sends the original message first and the extra message(s) after it.
    async buildFulfillmentMessages(name: string, messageText: string): Promise<any[]> {
        const fulfillmentMessages: any[] = [
            {
                "text" : {
                    "text" : [messageText]
                }
            }
        ];
        const extraEntries = await this.getExtraPayloadEntries(name);
        if (extraEntries.length === 0) {
            return fulfillmentMessages;
        }
        fulfillmentMessages.push({
            "payload" : {
                "messagetype" : "custom_payload",
                "payload"     : [
                    {
                        "messagetype" : "text",
                        "text"        : messageText
                    },
                    ...extraEntries
                ]
            }
        });
        return fulfillmentMessages;
    }

    // Accepts either a full Dialogflow custom payload ({ messagetype, payload: [...] }) or just
    // the array of payload entries, and returns the entries in both cases.
    private normalizeCustomPayload(customPayload: any): any[] {
        let parsedPayload = customPayload;
        if (typeof parsedPayload === 'string') {
            try {
                parsedPayload = JSON.parse(parsedPayload);
            } catch (error) {
                console.log("Custom payload is not valid JSON: ", error);
                return [];
            }
        }
        if (!parsedPayload) {
            return [];
        }
        if (Array.isArray(parsedPayload)) {
            return parsedPayload;
        }
        if (Array.isArray(parsedPayload.payload)) {
            return parsedPayload.payload;
        }
        return [];
    }

}
