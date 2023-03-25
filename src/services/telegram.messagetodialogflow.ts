/* eslint-disable init-declarations */
import { inject, Lifecycle, scoped } from "tsyringe";
import { TelegramRequest } from "./request.format/telegram.request";
import { TelegramMessageServiceFunctionalities } from "./telegram.message.service.functionalities";

@scoped(Lifecycle.ContainerScoped)
export class TelegramMessageToDialogflow {

    constructor (
        // eslint-disable-next-line max-len
        @inject(TelegramMessageServiceFunctionalities) private messageFunctionalities?: TelegramMessageServiceFunctionalities
    ) {}

    async *messageToDialogflow(requestBody: any) {
        const telegramRequestObject = new TelegramRequest(requestBody);
        const getMessageObj = telegramRequestObject.getMessage();
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
                    messagetoDialogflow = await this.messageFunctionalities[classmethod](messageObj);
                }
                else {
                    throw new Error(`${type}Message type is not known`);
                }
            }
            else {

                //messageObj is void
            }
            console.log("message to dialogflow", messagetoDialogflow);
            yield messagetoDialogflow;
        }
    }

}
