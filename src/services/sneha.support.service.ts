import { Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { ResponseHandler } from '../utils/response.handler';

@autoInjectable()
@singleton()
export class snehaMessagePlatformService implements platformServiceInterface{

    public response;

    constructor(private messageFlow?: MessageFlow,private responseHandler?: ResponseHandler,
    ) {

    }
    sendManualMesage(msg: any) {
        console.log("Method not implemented");
    }

    init() {
        console.log("Method not implemented");   
    }

    setWebhook(client: any) {
        console.log("Method not implemented");    }

    handleMessage(msg, client) {
        return this.messageFlow.checkTheFlow(msg, client, this);
    }

    getMessage(msg) {
        // eslint-disable-next-line init-declarations
        let returnMsg: Imessage;
        const phone = msg.phoneNumber.toString();

        if (msg.type === "text") {
            const message = msg.message; //+ ` PhoneNumber is ${phoneNumber}`;
            returnMsg = { name: null,platform: "Sneha_Support",chat_message_id: null, direction: "In",messageBody: message,imageUrl: null, sessionId: phone,replyPath: phone,latlong: null,type: 'text' , intent: null};
            return returnMsg;
        }
    }

    postResponse (message, response: IprocessedDialogflowResponseFormat ){
        const snehaSupport_Id = message.sessionId;
        const image = response.message_from_dialoglow.getImageObject();
        const messageType = image.url ? "image" : "text";
        // const raw_response_object = response.message_from_dialoglow.result && response.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(response.message_from_dialoglow.result.fulfillmentMessages) : '';
        const intent = response.message_from_dialoglow.getIntent();

        const responseMessage = { name: null,platform: "Sneha_Support",chat_message_id: null,direction: "Out",message_type: messageType,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: snehaSupport_Id, messageText: response.processed_message[0] };
        return responseMessage;

    }

    SendMediaMessage(contact,imageLink, message){
        this.responseHandler.sendSuccessResponseForApp(this.response, 201, "Message processed successfully.", { response_message: message });
        return message;
    }

}
