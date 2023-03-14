/* eslint-disable init-declarations */
import { WhatsappRequest } from "./request.format/whatsapp.request";
import { MessageFunctionalities } from './whatsapp.functionalities';
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class WhatsappMessageToDialogflow {

    constructor (private messageFunctionalities?: MessageFunctionalities) {}

    async *messageToDialogflow (requestBody: any) {
        const whatsappRequestObj = new WhatsappRequest(requestBody);
        const generatorGetMessage = whatsappRequestObj.getMessages();
        const generatorGetContacts = whatsappRequestObj.getContacts();
        let done = false;
        while (done === false){
            const messageNextObject = generatorGetMessage.next();
            const contactsNextObject = generatorGetContacts.next();
            const messageObj = messageNextObject.value;
            const contactsObj = contactsNextObject.value;
            done = messageNextObject.done;
            let messagetoDialogflow;
            if (messageObj){
                const type = messageObj.getType();
                if (type) {
                    const classmethod = `${type}MessageFormat`;
                    messageObj.setChannel(requestBody.channel);
                    // eslint-disable-next-line max-len
                    messagetoDialogflow = await this.messageFunctionalities[classmethod](messageObj);
                }
                else {
                    throw new Error(`${type}Message type is not known`);
                }
            }
            else {

                //messageObj is void
            }
            if (contactsObj){
                messagetoDialogflow.platformId = contactsObj.getPlatformId();
                messagetoDialogflow.name = contactsObj.getUserName();
            }
            yield messagetoDialogflow;
        }
    }

}
