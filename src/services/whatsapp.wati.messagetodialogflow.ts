import { WhatsappWatiRequest } from "./request.format/whatsapp.wati.request";
import { WatiMessageFunctionalities } from "./whatsapp.wati.functionalities";
import { inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class WhatsappWatiMessageToDialogflow {
    
    constructor (
        @inject(WatiMessageFunctionalities) private watiMessageFunctionalities?: WatiMessageFunctionalities
    ){}

    async *watiMessageToDialogflow (requestBody: any) {
        const whatsappWatiRequestObj = new WhatsappWatiRequest(requestBody);
        const getMessageObj = whatsappWatiRequestObj.getMessages();
        let done = false;
        while (done === false){
            const messageNextObject = getMessageObj.next();
            const messageObj = messageNextObject.value;
            done = messageNextObject.done;
            let messagetoDialogflow;
            if (messageObj){
                const type = messageObj.getType();
                if (type) {
                    const classmethod = `${type}MessageFormat`;
                    messageObj.setChannel(requestBody.channel);
                    // eslint-disable-next-line max-len
                    messagetoDialogflow = await this.watiMessageFunctionalities[classmethod](messageObj);
                    messagetoDialogflow.name = messageObj.getUserName();
                    messagetoDialogflow.platformId = messageObj.getUserId();
                }
                else {
                    throw new Error(`${type}Message type is not known`);
                }
            }
            else {

                //messageObj is void
            }
            yield messagetoDialogflow;
        }
    }

}