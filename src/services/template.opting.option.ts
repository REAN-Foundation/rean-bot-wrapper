import { ContactList } from "../models/contact.list";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { scoped, Lifecycle, inject } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class WhatsAppOptingOption{

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) {
    }

    async whatsAppOptingOptions(body, intent) {
        const payload = body.originalDetectIntentRequest.payload;
        // eslint-disable-next-line max-len
        const contactListRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(ContactList);
        return new Promise(async(resolve) =>{
            if (intent === "OptOut"){
                await contactListRepository.update({ optOut: "true" }, { where:{ mobileNumber: payload.userId } })
                    .then(() => {console.log("updated");})
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
                await contactListRepository.update({ optOut: "false" }, { where:{ mobileNumber: payload.userId } })
                    .then(() => {console.log("updated");})
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
