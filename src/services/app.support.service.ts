import { message } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { ResponseHandler } from '../utils/response.handler';

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
        return this.messageFlow.get_put_msg_Dialogflow(msg, client, this);
    }

    getMessage(msg) {
        // eslint-disable-next-line init-declarations
        let returnMessage: message;
        const phoneNumber = msg.phoneNumber.toString();

        if (msg.type === "text") {
            const message = msg.message + ` PhoneNumber is ${phoneNumber}`;
            returnMessage = { name: null,platform: "Rean_Support",chat_message_id: null, direction: "In",messageBody: message,sessionId: phoneNumber,replyPath: phoneNumber,latlong: null,type: 'text' };
            return returnMessage;
        }
    }

    postResponse (message, response ){
        const reansupport_Id = message.Id;
        const message_type = response.message_from_dialoglow.text.image.url ? "image" : "text";
        const raw_response_object = response.message_from_dialoglow.result && response.message_from_dialoglow.result.fulfillmentMessages ? JSON.stringify(response.message_from_dialoglow.result.fulfillmentMessages) : '';
        const intent = response.message_from_dialoglow.result && response.message_from_dialoglow.result.intent ? response.message_from_dialoglow.result.intent.displayName : '';

        const reaponse_message = { name: null,platform: "Rean_Support",chat_message_id: null,direction: "Out",message_type: message_type,raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: reansupport_Id, messageText: response.processed_message[0] };
        return reaponse_message;

    }

    SendMediaMessage(contact,imageLink, message){
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: message });
        return message;
    }

}
