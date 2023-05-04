import { ContactList } from "../models/contact.list";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { scoped, Lifecycle, inject } from "tsyringe";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class WhatsAppOptingOption{

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {
    }

    async whatsAppOptingOptions(body, intent) {
        const payload = body.originalDetectIntentRequest.payload;
        const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        // eslint-disable-next-line max-len
        const contactListRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService,clientName)).getRepository(ContactList);
        return new Promise(async(resolve) =>{
            if (intent === "OptOut"){
                await contactListRepository.update({ optOut: "true" }, { where: { mobileNumber: payload.userId } })
                    .then(() => { console.log("updated"); })
                    .catch(error =>console.log("error on update", error));
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    "You will not receive any notification from now. If you wish to receive notifications again in future then send 'I want to receive notification'."
                                ]
                            }
                        }
                    ]
                };
                resolve(data);
            }
            else if (intent === "OptIn"){
                await contactListRepository.update({ optOut: "false" }, { where: { mobileNumber: payload.userId } })
                    .then(() => { console.log("updated"); })
                    .catch(error =>console.log("error on update", error));
        
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    "You will receive notifications from now. If you wish to stop receive notifications in future then send 'Stop notification'."
                                ]
                            }
                        }
                    ]
                };
                resolve(data);
            }
        
        });

    }

}
