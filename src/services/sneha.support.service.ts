/* eslint-disable @typescript-eslint/no-unused-vars */
import { Imessage, IprocessedDialogflowResponseFormat, Iresponse } from '../refactor/interface/message.interface';
import { autoInjectable, inject, Lifecycle, scoped, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { ResponseHandler } from '../utils/response.handler';
import { RHGMessageToDialogflow } from './rhg.message.to.dialogflow';

@scoped(Lifecycle.ContainerScoped)
export class snehaMessagePlatformService implements platformServiceInterface{

    public res;

    constructor(@inject(MessageFlow) private messageFlow?: MessageFlow,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(RHGMessageToDialogflow) private rhgMessageToDialogflow?: RHGMessageToDialogflow
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
        const generatorRHGMessage = await this.rhgMessageToDialogflow.messageToDialogflow(msg);
        let done = false;
        const snehaMessages = [];
        
        // eslint-disable-next-line init-declarations
        let snehaMessagetoDialogflow: Imessage;
        while (done === false) {
            const nextgeneratorObj = generatorRHGMessage.next();
            snehaMessagetoDialogflow = (await nextgeneratorObj).value;
            done = (await nextgeneratorObj).done;
            snehaMessages.push(snehaMessagetoDialogflow);
        }
        for (snehaMessagetoDialogflow of snehaMessages){
            if (snehaMessagetoDialogflow) {
                await this.messageFlow.checkTheFlow(snehaMessagetoDialogflow, client, this);
            }
        }
    }

    postResponse (message, response: IprocessedDialogflowResponseFormat ){
        const snehaSupport_Id = message.platformId;
        const image = response.message_from_nlp.getImageObject();
        const messageType = image.url ? "image" : "text";
        const intent = response.message_from_nlp.getIntent();

        const responseMessage = { name: null,platform: "Sneha_Support",chat_message_id: null,direction: "Out",message_type: messageType,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: snehaSupport_Id, messageText: response.processed_message[0] };
        return responseMessage;

    }

    SendMediaMessage(response_format:Iresponse, message){
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: response_format.messageText });
        return response_format.messageText;
    }

}
