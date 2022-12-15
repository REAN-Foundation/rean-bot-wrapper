import { Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { ResponseHandler } from '../utils/response.handler';
import { RHGRequest } from './request.format/rhg.mobile.app';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{

    public translate = false;

    public res;

    constructor(private messageFlow?: MessageFlow,private responseHandler?: ResponseHandler,
    ) {

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setWebhook(client: any) {
        throw new Error('Method not implemented.');
    }

    init() {
        throw new Error('Method not implemented.');
    }

    sendManualMesage() {
        throw new Error('Method not implemented.');
    }

    createFinalMessageFromHumanhandOver() {
        throw new Error('Method not implemented.');
    }

    handleMessage(msg, client) {
        const generatorRhgObj = new RHGRequest(msg);
        const rhgGetMessageObj = generatorRhgObj.getMessage();
        let done = false;
        while (done === false) {
            const rhgNextRequestObj = rhgGetMessageObj.next();
            const rhgRequestBodyObj = rhgNextRequestObj.value;
            done = rhgNextRequestObj.done;
            let messagetoDialogflow: Imessage;
            if (rhgRequestBodyObj){
                const phoneNumber = rhgRequestBodyObj.getPhoneNumber();
                if (rhgRequestBodyObj.isText() === true) {
                    const message = rhgRequestBodyObj.getMessage(); //+ ` PhoneNumber is ${phoneNumber}`;
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
            
            return this.messageFlow.checkTheFlow(messagetoDialogflow, client, this);
        }
        
    }

    postResponse (message, response: IprocessedDialogflowResponseFormat ){
        const reansupport_Id = message.platformId;
        const image = response.message_from_dialoglow.getImageObject();
        const message_type = image.url ? "image" : "text";
        // const raw_response_object = response.message_from_dialoglow.result && response.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(response.message_from_dialoglow.result.fulfillmentMessages) : '';
        const intent = response.message_from_dialoglow.getIntent();

        const reaponse_message = { name: null,platform: "Rean_Support",chat_message_id: null,direction: "Out",message_type: message_type,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: reansupport_Id, messageText: response.processed_message[0] };
        return reaponse_message;

    }

    SendMediaMessage(contact,imageLink, message){
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: message });
        return message;
    }

}
