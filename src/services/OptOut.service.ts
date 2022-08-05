import { ContactList } from "../models/contact.list";

export class OptOut{

    async whatsAppOptOut(body) {
        console.log("eventobj for live agent",body);
        const payload = body.originalDetectIntentRequest.payload;
        console.log("payload", payload);
        return new Promise(async(resolve) =>{
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
        });

    }

}