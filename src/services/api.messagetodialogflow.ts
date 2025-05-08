/* eslint-disable init-declarations */
import { ApiRequest } from "./request.format/api.request";
import { MockCHannelMessageFunctionalities } from './mock.channel.message.funtionalities';
import { inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class ApiMessageToDialogflow {

    constructor (
        @inject(MockCHannelMessageFunctionalities) private messageFunctionalities?: MockCHannelMessageFunctionalities
    ) {}

    async *messageToDialogflow (requestBody: any) {
        const apiRequestObj = new ApiRequest(requestBody);
        const generatorGetMessage = apiRequestObj.getMessages();
        const generatorGetContacts = apiRequestObj.getContacts();
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
