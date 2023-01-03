/* eslint-disable init-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
// import http from 'https';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import fs from 'fs';
import { AwsS3manager } from './aws.file.upload.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable, singleton, inject, delay } from 'tsyringe';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { MockCHannelMessageFunctionalities } from './mock.channel.message.funtionalities';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { ChatMessage } from '../models/chat.message.model';
import { WhatsappRequest } from './request.format/whatsapp.request';

@autoInjectable()
@singleton()
export class MockMessageService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        private awsS3manager?: AwsS3manager,
        private messageFunctionalitiesmockchannel?: MockCHannelMessageFunctionalities){}

    async handleMessage(requestBody: any, channel: string) {
        const mockRequestObj = new WhatsappRequest(requestBody);
        const generatorGetMessage = mockRequestObj.getMessages();
        const generatorGetContacts = mockRequestObj.getContacts();
        let done = false;
        while (done === false){
            const messageNextObject = generatorGetMessage.next();
            const contactsNextObject = generatorGetContacts.next();
            const mockMessageObj = messageNextObject.value;
            const mockContactsObj = contactsNextObject.value;
            done = messageNextObject.done;
            let messagetoDialogflow;
            if (mockMessageObj){
                const type = mockMessageObj.getType();
                if (type) {
                    const classmethod = `${type}MessageFormat`;
                    messagetoDialogflow = await this.messageFunctionalitiesmockchannel[classmethod](mockMessageObj);
                }
                else {
                    throw new Error(`${type}Message type is not known`);
                }
            }
            else {

                //messageObj is void
            }
            if (mockContactsObj){
                messagetoDialogflow.platformId = mockContactsObj.getPlatformId();
                messagetoDialogflow.name = mockContactsObj.getUserName();
            }
            console.log("message to dialogflow", messagetoDialogflow);
            await this.messageFlow.checkTheFlow(messagetoDialogflow, channel, this);
        }
    }

    sendManualMesage(msg: any) {
        return this.messageFlow.send_manual_msg(msg, this);
    }

    init() {
        throw new Error('Method not implemented.');
    }

    setWebhook(clientName: string){
        throw new Error('Method not implemented.');
    }

    createFinalMessageFromHumanhandOver(requestBody: any) {
        throw new Error('Method not implemented.');
    }

    postDataFormatWhatsapp = (contact) => {

        const postData = {
            "messaging_product" : "whatsapp",
            "recipient_type"    : "individual",
            "to"                : contact,
            "type"              : null
        };
        return postData;
    };

    async postRequestMessages(postdata) {
        
        //Not required
    }

    SendMediaMessage = async (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) => {

        //call a function that creates csv
        const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: contact } });
        const lastMessageDate = respChatMessage[respChatMessage.length - 1].createdAt;
        const obj = { timeStamp: lastMessageDate, message: message };
        console.log("obj", obj);
    };

    getMessage = async (message: any) => {
        console.log("messages mock", message);
        if (message.messages[0].type === "text") {
            // eslint-disable-next-line max-len
            return await this.messageFunctionalitiesmockchannel.textMessageFormat(message);
        }
        else {
            throw new Error("Message is not text");
        }
    };

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        // eslint-disable-next-line init-declarations
        let reaponse_message: Iresponse;
        const mock_whatsapp_id = message.platformId;
        const mock_input_message = message.messageBody;
        const mock_user_name = message.name;
        const mock_chat_message_id = message.chat_message_id;
        const image = processedResponse.message_from_dialoglow.getImageObject();
        const pasrseMode = processedResponse.message_from_dialoglow.getParseMode();
        const payload = processedResponse.message_from_dialoglow.getPayload();
        const intent = processedResponse.message_from_dialoglow.getIntent();

        if (processedResponse) {
            if (image && image.url) {
                reaponse_message = { name: mock_user_name, platform: "MockChannel", chat_message_id: mock_chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: image.caption };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (pasrseMode && pasrseMode === 'HTML') {
                    // eslint-disable-next-line max-len
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: mock_user_name, platform: "MockChannel", chat_message_id: mock_chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[1] };
                    }
                }
                else {
                    reaponse_message = { name: mock_user_name, platform: "MockChannel", chat_message_id: mock_chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[0] };
                    reaponse_message = { name: mock_user_name, platform: "MockChannel", chat_message_id: mock_chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[1] };
                }
            }
            else {
                let message_type = "text";
                if (payload !== null){
                    message_type = payload.fields.messagetype.stringValue;
                }
                
                reaponse_message = { name: mock_user_name, platform: "MockChannel", chat_message_id: mock_chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[0] };
            }
        }
        return reaponse_message;
    };

}
