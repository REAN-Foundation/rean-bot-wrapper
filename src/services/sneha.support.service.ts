import { Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { ResponseHandler } from '../utils/response.handler';
import { RHGMessageToDialogflow } from './rhg.message.to.dialogflow';

@autoInjectable()
@singleton()
export class snehaMessagePlatformService implements platformServiceInterface{

    public res;

    constructor(private messageFlow?: MessageFlow,
        private responseHandler?: ResponseHandler,
        private rhgMessageToDialogflow?: RHGMessageToDialogflow
    ) {

    }

    setWebhook(client: any) {
        console.log("Method not implemented.");
    }

    init() {
        console.log("Method not implemented.");
    }

    sendManualMesage() {
        console.log("Method not implemented.");
    }

    createFinalMessageFromHumanhandOver() {
        console.log("Method not implemented.");
    }

    async handleMessage(msg, client) {
        const messagetoDialogflow = await this.rhgMessageToDialogflow.messageToDialogflow(msg);
        return this.messageFlow.checkTheFlow(messagetoDialogflow, client, this);
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
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: message });
        return message;
    }

}
