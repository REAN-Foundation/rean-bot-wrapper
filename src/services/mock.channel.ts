/* eslint-disable init-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { AwsS3manager } from './aws.file.upload.service.js';
import { inject, delay, scoped, Lifecycle } from 'tsyringe';
import type { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface.js';
import type { platformServiceInterface } from '../refactor/interface/platform.interface.js';
import { MessageFlow } from './get.put.message.flow.service.js';
import { MockCHannelMessageFunctionalities } from './mock.channel.message.funtionalities.js';
import { ChatMessage } from '../models/chat.message.model.js';
import { ApiMessageToDialogflow } from './api.messagetodialogflow.js';
import request from 'request';
import { EntityManagerProvider } from './entity.manager.provider.service.js';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';

@scoped(Lifecycle.ContainerScoped)
export class MockMessageService implements platformServiceInterface {

    public res;

    private req;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject( AwsS3manager ) private awsS3manager?: AwsS3manager,
        @inject(MockCHannelMessageFunctionalities) private messageFunctionalitiesmockchannel?: MockCHannelMessageFunctionalities,
        @inject(ApiMessageToDialogflow) public apiMessageToDialogflow?: ApiMessageToDialogflow,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    getMessageIdFromResponse(responseBody: any) {
        throw new Error('Method not implemented.');
    }

    async handleMessage(requestBody: any, channel: string) {
        this.req = requestBody;
        const generatorMockMessage = this.apiMessageToDialogflow.messageToDialogflow(requestBody);
        let done = false;
        const mockMessages = [];
        let mockMessagetoDialogflow: Imessage;

        // Checking Mock messages
        while (done === false) {
            const nextgeneratorObj = generatorMockMessage.next();
            mockMessagetoDialogflow = (await nextgeneratorObj).value;
            done = (await nextgeneratorObj).done;
            mockMessages.push(mockMessagetoDialogflow);
        }
        for (mockMessagetoDialogflow of mockMessages){
            if (mockMessagetoDialogflow) {
                //mockMessagetoDialogflow.platform = 'MockChannel';
                const response = await this.messageFlow.checkTheFlowRouter(mockMessagetoDialogflow, channel, this);
                return response;
            }
        }

        // Original Mock Channel Setup - now updated to Mock Whatsapp Message Functionalities
        // const mockRequestObj = new WhatsappRequest(requestBody);
        // const generatorGetMessage = mockRequestObj.getMessages();
        // const generatorGetContacts = mockRequestObj.getContacts();
        // let done = false;
        // while (done === false){
        //     const messageNextObject = generatorGetMessage.next();
        //     const contactsNextObject = generatorGetContacts.next();
        //     const mockMessageObj = messageNextObject.value;
        //     const mockContactsObj = contactsNextObject.value;
        //     done = messageNextObject.done;
        //     let messagetoDialogflow;
        //     if (mockMessageObj){
        //         const type = mockMessageObj.getType();
        //         if (type) {
        //             const classmethod = `${type}MessageFormat`;
        //             messagetoDialogflow = await this.messageFunctionalitiesmockchannel[classmethod](mockMessageObj);
        //         }
        //         else {
        //             throw new Error(`${type}Message type is not known`);
        //         }
        //     }
        //     else {
        //         //messageObj is void
        //     }
        //     if (mockContactsObj){
        //         messagetoDialogflow.platformId = mockContactsObj.getPlatformId();
        //         messagetoDialogflow.name = mockContactsObj.getUserName();
        //     }
        //     console.log("message to dialogflow", messagetoDialogflow);
        //     await this.messageFlow.checkTheFlow(messagetoDialogflow, channel, this);
        // }

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

    SendMediaMessage = async (response_format:Iresponse, payload: any) => {
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: response_format.sessionId } });
        const lastMessageDate = respChatMessage[respChatMessage.length - 1].createdAt;
        const obj = { timeStamp: lastMessageDate, message: response_format.messageText };
        if (this.req.test_method === "RAGAS") {
            return {
                "answer" : response_format.messageText,
                "intent" : response_format.intent,
                "similar_docs" : response_format.similarDoc
            };
        }
        else {
            return {
                Status: "success",
                conversationid: response_format.sessionId,
                responses: [
                    {
                        text: response_format.messageText,
                        payload: payload
                    }
                ]
            };
            // const mockUri = "http://127.0.0.1:80/listener";
            // try {
            //     const response = await request({
            //         method : 'POST',
            //         uri    : mockUri,
            //         body   : {
            //             conversationId : `${respChatMessage[respChatMessage.length - 2].messageId}`,
            //             responses      : [
            //                 {
            //                     text    : response_format.messageText,
            //                     payload : payload
            //                 }
            //             ]
            //         },
            //         json : true
            //     });
            // } catch (error) {
            //     console.log("Error in sending to botium");
            // }
        }

    };

    getMessage = async (message: any) => {
        console.log("messages mock", message);
        if (message.messages[0].type === "text") {
            return await this.messageFunctionalitiesmockchannel.textMessageFormat(message);
        } else if (message.messages[0].type === "interactive-list") {
            return await this.messageFunctionalitiesmockchannel.interactiveListMessageFormat(message);
        }
        else {
            throw new Error("Message is not text");
        }
    };

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        let reaponse_message: Iresponse;
        const mock_whatsapp_id = message.platformId;
        const mock_input_message = message.messageBody;
        const mock_user_name = message.name;
        const mock_chat_message_id = message.chat_message_id;
        const image = processedResponse.message_from_nlp.getImageObject();
        const pasrseMode = processedResponse.message_from_nlp.getParseMode();
        const payload = processedResponse.message_from_nlp.getPayload();
        const intent = processedResponse.message_from_nlp.getIntent();
        const similarDoc = processedResponse.message_from_nlp.getSimilarDoc();
        const platformId = message.platformId;

        if (processedResponse) {
            if (image && image.url) {
                reaponse_message = { name: mock_user_name, platform: "MockChannel", platformId: platformId, chat_message_id: mock_chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: image.url, messageImageUrl: image.url, messageImageCaption: image.caption, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: image.caption, similarDoc: similarDoc };
            }
            else if (processedResponse.processed_message.length > 1) {
                if (pasrseMode && pasrseMode === 'HTML') {
                    const uploadImageName = await this.awsS3manager.createFileFromHTML(processedResponse.processed_message[0]);
                    const vaacinationImageFile = await this.awsS3manager.uploadFile(uploadImageName);
                    if (vaacinationImageFile) {
                        reaponse_message = { name: mock_user_name, platform: "MockChannel", platformId: platformId, chat_message_id: mock_chat_message_id, direction: "Out", message_type: "image", intent: intent, messageBody: String(vaacinationImageFile), messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[1], similarDoc: similarDoc };
                    }
                }
                else {
                    reaponse_message = { name: mock_user_name, platform: "MockChannel", platformId: platformId, chat_message_id: mock_chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[0], similarDoc: similarDoc };
                    reaponse_message = { name: mock_user_name, platform: "MockChannel", platformId: platformId, chat_message_id: mock_chat_message_id, direction: "Out", message_type: "text", intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[1], similarDoc: similarDoc };
                }
            }
            else {
                let message_type = "text";
                if (payload !== null){
                    message_type = payload.fields.messagetype.stringValue;
                }
                reaponse_message = { name: mock_user_name, platform: "MockChannel", platformId: platformId, chat_message_id: mock_chat_message_id, direction: "Out", message_type: message_type, intent: intent, messageBody: null, messageImageUrl: null, messageImageCaption: null, sessionId: mock_whatsapp_id, input_message: mock_input_message, messageText: processedResponse.processed_message[0], similarDoc: similarDoc };
            }
        }
        return reaponse_message;
    };

}
