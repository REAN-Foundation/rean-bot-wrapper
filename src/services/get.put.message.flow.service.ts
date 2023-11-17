/* eslint-disable max-len */
/* eslint-disable linebreak-style */
import { Imessage, Iresponse } from '../refactor/interface/message.interface';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { handleRequestservice } from './handle.request.service';
import { delay, inject, Lifecycle, scoped } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { ChatMessage } from '../models/chat.message.model';
import { GoogleTextToSpeech } from './text.to.speech';
import { SlackMessageService } from "./slack.message.service";
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { translateService } from './translate.service';
import { sendApiButtonService, templateButtonService } from './whatsappmeta.button.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ServeAssessmentService } from './maternalCareplan/serveAssessment/serveAssessment.service';
import { AssessmentSessionLogs } from '../models/assessment.session.model';

@scoped(Lifecycle.ContainerScoped)
export class MessageFlow{

    private chatMessageConnection;
    
    constructor(
        @inject(delay(() => SlackMessageService)) private slackMessageService,
        @inject(handleRequestservice) private handleRequestservice?: handleRequestservice,
        @inject(translateService) private translate?: translateService,
        @inject(GoogleTextToSpeech) private googleTextToSpeech?: GoogleTextToSpeech,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,) {
    }

    async checkTheFlow(messagetoDialogflow, channel: string, platformMessageService: platformServiceInterface){

        if (messagetoDialogflow.messageBody === ' '){
            messagetoDialogflow.messageBody = 'Empty message Body';
        }

        //initialising MySQL DB tables
        const chatMessageObj = await this.engageMySQL(messagetoDialogflow);
        
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const resp = await chatMessageRepository.findAll({ where: { userPlatformID: chatMessageObj.userPlatformID } });
        const humanHandoff = resp[resp.length - 1].humanHandoff;
        const ts = resp[resp.length - 1].supportChannelTaskID;
        if (humanHandoff === "true" ){
            this.slackMessageService.delayedInitialisation();
            const client = this.slackMessageService.client;
            const channelID = this.slackMessageService.channelID;
            await client.chat.postMessage({ channel: channelID, text: chatMessageObj.messageContent, thread_ts: ts });
                
        }
        else {
            this.processMessage(messagetoDialogflow, channel, platformMessageService);
        }
        
    }

    async processMessage(messagetoDialogflow: Imessage, channel: string ,platformMessageService: platformServiceInterface) {

        //response Object from Dialogflow
        const processedResponse = await this.handleRequestservice.handleUserRequest(messagetoDialogflow, channel);

        //converting the response Object to proper response object as per interface
        const response_format: Iresponse = await platformMessageService.postResponse(messagetoDialogflow, processedResponse);

        //save the response data to DB
        await this.saveResponseDataToUser(response_format,processedResponse);

        const intent = processedResponse.message_from_nlp.getIntent();
        await this.saveIntent(intent,response_format.sessionId);

        const payload = processedResponse.message_from_nlp.getPayload();
        if (processedResponse.message_from_nlp.getText()) {
            let message_to_platform = null;

            await this.replyInAudio(messagetoDialogflow, response_format);
            message_to_platform = await platformMessageService.SendMediaMessage(response_format,payload);

            if (!processedResponse.message_from_nlp.getText()) {
                console.log('An error occurred while sending messages!');
            }
            return message_to_platform;
        }
        else {
            console.log('An error occurred while processing messages!');
        }
    }

    async replyInAudio(message: Imessage, response_format: Iresponse) {
        if (message.type === "voice") {
            const id = message.platformId;
            const audioURL = await this.googleTextToSpeech.texttoSpeech(response_format.messageText, id);
            response_format.message_type = "voice";
            response_format.messageBody = audioURL;
        }
        else {
            console.log("audio reply not required");
        }
    }

    async send_manual_msg (msg,platformMessageService: platformServiceInterface) {
        let payload = {};
        let messageType = "";
        let assessmentSession = null;
        if (msg.type === "template") {
            payload["templateName"] = msg.templateName;
            if (msg.agentName !== 'postman') {
                msg.message = JSON.parse(msg.message);
            }
            payload["variables"] = msg.message.Variables;
            payload["languageForSession"] = "en";
            if (msg.provider !== "REAN_BW") {
                const languageForSession = await this.translate.detectUsersLanguage( msg.userId);
                if (msg.agentName !== 'postman') {
                    msg.message.Variables = JSON.parse(msg.message.Variables);
                }
                if (msg.message.Variables[`${languageForSession}`]) {
                    payload["variables"] = msg.message.Variables[`${languageForSession}`];
                    payload["languageForSession"] = languageForSession;
                } else {
                    payload["variables"] = msg.message.Variables[this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE")];
                    payload["languageForSession"] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
                }
            }
        }
        else if (msg.type === "text") {
            
            //const translatedMessage = await this.translate.translatePushNotifications( msg.message, msg.userId);
            const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            if (clientName === "KENYA_MATERNAL") {
                const languageForSession = await this.translate.detectUsersLanguage( msg.userId);
                if (msg.agentName !== 'postman') {
                    msg.message = JSON.parse(msg.message);
                }
                msg.message = msg.message[`${languageForSession}`];
                msg.message = await msg.message.replace("PatientName", msg.payload.PersonName ?? "");
            }
        }
        else if (msg.type === "interactivebuttons") {
            payload = await sendApiButtonService(msg.payload);
        }
        else if (msg.type === "reancareAssessment") {
            messageType = msg.type;
            msg.type = 'template';
            const { metaPayload, assessmentSessionLogs } = await this.serveAssessmentService.startAssessment(msg, msg.payload);
            assessmentSession = assessmentSessionLogs;
            payload = metaPayload;
            console.log(`assessment record ${JSON.stringify(payload)}`);
        }
        
        if (msg.message.ButtonsIds != null) {
            payload["buttonIds"] = await templateButtonService(msg.message.ButtonsIds);
        }
        const response_format = await platformMessageService.createFinalMessageFromHumanhandOver(msg);
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const chatSessionModel = await chatSessionRepository.findOne({ where: { userPlatformID: response_format.sessionId } });
        let chatSessionId = null;
        if (chatSessionModel) {
            chatSessionId = chatSessionModel.autoIncrementalID;
        }
        const chatMessageObj = {
            chatSessionID  : chatSessionId,
            platform       : response_format.platform,
            direction      : response_format.direction,
            messageType    : response_format.message_type,
            messageContent : response_format.messageText,
            imageContent   : response_format.messageBody,
            imageUrl       : response_format.messageImageUrl,
            userPlatformID : response_format.sessionId,
            intent         : response_format.intent
        };

        if (msg.type === "template") {
            chatMessageObj.intent = payload["templateName"];
        }

        const ChatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const person = ChatMessageRepository.create(chatMessageObj);
        console.log(`DB response ${person}`);

        let message_to_platform = null;
        // eslint-disable-next-line max-len
        message_to_platform = await platformMessageService.SendMediaMessage(response_format, payload);

        if (messageType === "reancareAssessment") {
            assessmentSession.userMessageId = message_to_platform.body.messages[0].id;
            const AssessmentSessionRepo = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
            await AssessmentSessionRepo.create(assessmentSession);
        }
        return message_to_platform;
    }

    async engageMySQL(messagetoDialogflow: Imessage) {
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const chatSessionModel = await chatSessionRepository.findOne({ where: { userPlatformID: messagetoDialogflow.platformId } });
        console.log("chatSessionModel", chatSessionModel);
        let chatSessionId = null;
        if (chatSessionModel) {
            chatSessionId = chatSessionModel.autoIncrementalID;
        }
        const chatMessageObj = {
            chatSessionID                            : chatSessionId,
            name                                     : messagetoDialogflow.name,
            platform                                 : messagetoDialogflow.platform,
            direction                                : messagetoDialogflow.direction,
            messageType                              : messagetoDialogflow.type,
            messageContent                           : messagetoDialogflow.messageBody,
            messageId                                : messagetoDialogflow.chat_message_id,
            imageContent                             : null,
            imageUrl                                 : messagetoDialogflow.imageUrl,
            userPlatformID                           : messagetoDialogflow.platformId,
            intent                                   : null,
            responseMessageID                        : messagetoDialogflow.responseMessageID,
            contextId                                : messagetoDialogflow.contextId,
            whatsappResponseStatusSentTimestamp      : null,
            whatsappResponseStatusDeliveredTimestamp : null,
            whatsappResponseStatusReadTimestamp      : null,
            supportchannelName                       : null,
            supportChannelTaskID                     : null,
            humanHandoff                             : null,
            feedbackType                             : null
        };

        // await this.sequelizeClient.connect();
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const personrequest = await chatMessageRepository.create(chatMessageObj);
        this.chatMessageConnection = personrequest;
        const userId = chatMessageObj.userPlatformID;
        const respChatSession = await chatSessionRepository.findAll({ where: { userPlatformID: userId } });
        const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userId } });
        const lastMessageDate = respChatMessage[respChatMessage.length - 1].createdAt;

        //check if user is new, if new then make a new entry in table contact list
        const contactListRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
        const respContactList = await contactListRepository.findAll({ where: { mobileNumber: userId } });

        // console.log("respContactList!!!", respContactList);
        if (respContactList.length === 0) {
            await contactListRepository.create({
                mobileNumber : messagetoDialogflow.platformId,
                username     : messagetoDialogflow.name,
                platform     : messagetoDialogflow.platform,
                optOut       : "false" });
                    
            // console.log("newContactlistEntry", newContactlistEntry);
            // await newContactlistEntry.save();
        }

        //start or continue a session
        if (respChatSession.length === 0 || respChatSession[respChatSession.length - 1].sessionOpen === "false") {

            // console.log("starting a new session");
            await chatSessionRepository.create({ userPlatformID  : messagetoDialogflow.platformId,
                platform        : messagetoDialogflow.platform, sessionOpen     : "true",
                lastMessageDate : lastMessageDate, askForFeedback  : "flase" });

            // console.log("newChatsession", newChatsession);
            // await newChatsession.save();
        }
        else {
            const autoIncrementalID = respChatSession[respChatSession.length - 1].autoIncrementalID;
            await chatSessionRepository.update({ lastMessageDate: lastMessageDate }, { where: { autoIncrementalID: autoIncrementalID } } )
                .then(() => { console.log("updated lastMessageDate"); })
                .catch(error => console.log("error on update", error));
        }
        return chatMessageObj;
        
    }

    saveResponseDataToUser = async(response_format,processedResponse) => {
        const intent = processedResponse.message_from_nlp.getIntent();
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const chatSessionModel = await chatSessionRepository.findOne({ where: { userPlatformID: response_format.sessionId } });
        let chatSessionId = null;
        if (chatSessionModel) {
            chatSessionId = chatSessionModel.autoIncrementalID;
        }
        const dfResponseObj = {
            chatSessionID  : chatSessionId,
            platform       : response_format.platform,
            direction      : response_format.direction,
            messageType    : response_format.message_type,
            messageContent : response_format.messageText,
            imageContent   : response_format.messageBody,
            imageUrl       : response_format.messageImageUrl,
            userPlatformID : response_format.sessionId,
            intent         : intent
        };
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        await (await chatMessageRepository.create(dfResponseObj)).save();
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async saveIntent(intent:string, userPlatformID: string){
        try {
            this.chatMessageConnection.intent = intent;
            this.chatMessageConnection.save();

            // const lastMessage = await ChatMessage.findAll({
            //     limit : 1,
            //     where : {
            //         userPlatformID : userPlatformID,
            //         direction      : 'IN'
            //     },
            //     order : [ [ 'createdAt', 'DESC' ]]
            // });
            // await ChatMessage.update(
            //     {intent: intent},
            //     {
            //         where : {
            //             id : lastMessage[0].id,
            //         }
            //     }
            // );
        } catch (error) {
            console.log(error);
        }
    }

    // async serveReancareAssessment(message :any, payload: any){
    //     try {
    //         const {message } = await this.serveAssessmentService.startAssessment(msg, msg.payload);

    //         return { message, payload };
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

}
