import { Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { ResponseHandler } from '../utils/response.handler';
import { RHGMessageToDialogflow } from './rhg.message.to.dialogflow';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{

    public translate = false;

    public res;

    constructor(private messageFlow?: MessageFlow,
        private responseHandler?: ResponseHandler,
        private rhgMessageToDialogflow?: RHGMessageToDialogflow
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

    async handleMessage(msg, client) {
        const generatorRHGMessage = this.rhgMessageToDialogflow.messageToDialogflow(msg);
        let done = false;
        const rhgMessages = [];
        let rhgMessagetoDialogflow: Imessage;
        while (done === false) {
            const nextgeneratorObj = generatorRHGMessage.next();
            rhgMessagetoDialogflow = (await nextgeneratorObj).value;
            done = (await nextgeneratorObj).done;
            rhgMessages.push(rhgMessagetoDialogflow);
        }
        for (rhgMessagetoDialogflow of rhgMessages){
            if (rhgMessagetoDialogflow) {
                await this.messageFlow.checkTheFlow(rhgMessagetoDialogflow, client, this);
            }
        }
        
    }

    postResponse (message, response: IprocessedDialogflowResponseFormat ){
        const reansupport_Id = message.platformId;
        const image = response.message_from_dialoglow.getImageObject();
        const message_type = image.url ? "image" : "text";
        const intent = response.message_from_dialoglow.getIntent();

        const reaponse_message = { name: null,platform: "Rean_Support",chat_message_id: null,direction: "Out",message_type: message_type,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: reansupport_Id, messageText: response.processed_message[0] };
        return reaponse_message;

    }

    SendMediaMessage(contact,imageLink, message){
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: message });
        return message;
    }

}
