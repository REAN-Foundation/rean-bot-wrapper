import { ContactList } from "../models/contact.list";

export class WhatsAppOptingOption{

    async whatsAppOptingOptions(body, intent) {
        const payload = body.originalDetectIntentRequest.payload;
        return new Promise(async(resolve) =>{
            if (intent === "OptOut"){
                await ContactList.update({ optOut: "true" }, { where:{ mobileNumber: payload.userId } })
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
                await ContactList.update({ optOut: "false" }, { where:{ mobileNumber: payload.userId } })
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
