import { ContactList } from "../models/contact.list";

export class OptIn{

    async whatsAppOptIn(body) {
        console.log("eventobj for live agent",body);
        const payload = body.originalDetectIntentRequest.payload;
        console.log("payload", payload);
        return new Promise(async(resolve) =>{
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
        });

    }

}