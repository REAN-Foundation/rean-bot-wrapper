/* eslint-disable init-declarations */
import { RHGRequest } from "./request.format/rhg.mobile.app";

export class RHGMessageToDialogflow{

    async *messageToDialogflow(msg: any) {
        const generatorRhgObj = new RHGRequest(msg);
        const rhgGetMessageObj = generatorRhgObj.getMessage();
        let done = false;
        while (done === false) {
            const rhgNextRequestObj = rhgGetMessageObj.next();
            const rhgRequestBodyObj = rhgNextRequestObj.value;
            done = rhgNextRequestObj.done;
            let messagetoDialogflow;
            if (rhgRequestBodyObj){
                const phoneNumber = rhgRequestBodyObj.getPhoneNumber();
                if (rhgRequestBodyObj.isText() === true) {
                    const message = rhgRequestBodyObj.getMessage();
                    messagetoDialogflow = {
                        name                      : null,
                        platform                  : "Rean_Support",
                        chat_message_id           : null,
                        direction                 : "In",
                        messageBody               : message,
                        imageUrl                  : null,
                        platformId                : phoneNumber,
                        replyPath                 : phoneNumber,
                        latlong                   : null,
                        type                      : 'text' ,
                        intent                    : null,
                        whatsappResponseMessageId : null,
                        contextId                 : null,
                        telegramResponseMessageId : null
                    };
                }
            }
            yield messagetoDialogflow;
        }
    }
    
}
