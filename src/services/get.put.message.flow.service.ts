/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable linebreak-style */
import { Imessage, Iresponse, OutgoingMessage } from '../refactor/interface/message.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { handleRequestservice } from './handle.request.service';
import { delay, inject, Lifecycle, scoped } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { ChatMessage } from '../models/chat.message.model';
import { GoogleTextToSpeech } from './text.to.speech';
import { SlackMessageService } from "./slack.message.service";
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { ReminderMessage } from '../models/reminder.model';
import { translateService } from './translate.service';
import { sendApiButtonService, templateButtonService, watiTemplateButtonService } from './whatsappmeta.button.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ServeAssessmentService } from './maternalCareplan/serveAssessment/serveAssessment.service';
import { AssessmentSessionLogs } from '../models/assessment.session.model';
import { DecisionRouter } from './langchain/decision.router.service';
import { CacheMemory } from './cache.memory.service';
import { Helper } from '../common/helper';
import needle from "needle";
import { sendTelegramButtonService } from './telegram.button.service';
import { Logger } from '../common/logger';
import { MessageHandlerType } from '../refactor/messageTypes/message.types';
import { AssessmentIdentifiers } from '../models/assessment/assessment.identifiers.model';
import { WhatsAppFlowTemplateRequest } from '../domain.types/message.type/flow.message.types';

// import { AssessmentIdentifiers } from '../models/assessment/assessment.identifiers.model';

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
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(DecisionRouter) private decisionRouter?: DecisionRouter) {
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

    async checkTheFlowRouter(messageToLlmRouter: Imessage, channel: string, platformMessageService: platformServiceInterface){
        try {
            console.log(`checkTheFlowRouter messageToLlmRouter:${messageToLlmRouter} \n Chaneel : ${channel}`);
            const preprocessedOutgoingMessage = await this.preprocessOutgoingMessage(messageToLlmRouter);
            console.log("Processed outgoing message", JSON.stringify(preprocessedOutgoingMessage, null, 2));

            console.log("The message is being set to make the decision");
            const outgoingMessage: OutgoingMessage = await this.decisionRouter.getDecision(preprocessedOutgoingMessage.message, channel);
            console.log("The outgoing message is being handled in routing");
            if (
                this.clientEnvironmentProviderService.getClientEnvironmentVariable("NLP_TRANSLATE_SERVICE") === "llm"
            &&
                outgoingMessage.QnA.NLPProvider === "LLM"
            ) {
                outgoingMessage.MetaData.messageBody = preprocessedOutgoingMessage.translate_message['original_message'];
            }
            const processedResponse = await this.handleRequestservice.handleUserRequestForRouting(outgoingMessage, platformMessageService);

            if (outgoingMessage.PrimaryMessageHandler !== MessageHandlerType.WorkflowService && processedResponse.message_from_nlp) {
                const response = await this.processOutgoingMessage(messageToLlmRouter, channel, platformMessageService, processedResponse);

                // Update the DB using message Id only if outgoing meesage is related with assessment
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                const assessmentSessionRepo = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
                const key = `${messageToLlmRouter.platformId}:NextQuestionFlag:${outgoingMessage.Assessment.AssessmentId}`;
                const nextQuestionFlag = await CacheMemory.get(key);
                if (nextQuestionFlag === true && outgoingMessage.PrimaryMessageHandler === "Assessments") {
                    const messageId = platformMessageService.getMessageIdFromResponse(response);
                    await this.serveAssessmentService.updateDBChatSessionWithMessageId(messageToLlmRouter.platformId, messageId, chatMessageRepository, assessmentSessionRepo);
                }
                return response;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async preprocessOutgoingMessage(message: Imessage){
        try {
            await this.engageMySQL(message);
            console.log("Get put message.type: ",message.type);
            console.log("Get put message.messageBody: ",message.messageBody);
            if ( message.type === 'nfm_reply' ) {
                 return {
                    message,
                    translate_message: {
                        message: message.messageBody,
                        original_message: message.messageBody,
                        languageForSession: null
                    }
                };
            }
            const translate_message = await this.translate.translateMessage(message.type, message.messageBody, message.platformId);
            translate_message["original_message"] = message.messageBody;
            message.messageBody = translate_message.message;
            message.originalMessage = translate_message["original_message"];
            return { message, translate_message };
        } catch (error) {
            console.log(error);
        }
    }

    async processOutgoingMessage(messageToLlmRouter: Imessage, channel: string, platformMessageService: platformServiceInterface, processedResponse){
        try {
            const response_format: Iresponse = await platformMessageService.postResponse(messageToLlmRouter, processedResponse);
            response_format.sensitivity = processedResponse.message_from_nlp.getSensitivity();

            await this.saveResponseDataToUser(response_format, processedResponse);

            const intent = processedResponse.message_from_nlp.getIntent();
            await this.saveIntent(intent, response_format.sessionId);

            const payload = processedResponse.message_from_nlp.getPayload();
            if (processedResponse.message_from_nlp.getText()){
                let message_to_platform = null;

                await this.replyInAudio(messageToLlmRouter, response_format);
                message_to_platform = await platformMessageService.SendMediaMessage(response_format, payload);

                if (!processedResponse.message_from_nlp.getText()) {
                    console.log('An error occured while sending message');
                }
                return message_to_platform;
            } else {
                console.log('An error occured while sending message');
            }
        } catch (error) {
            console.log(error);
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
        let personName = " ";
        const contactList = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
        const personContactList = await contactList.findOne({ where: { mobileNumber: msg.userId } });
        const reminderMessage = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ReminderMessage);
        const defaultLangaugeCode = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE") ?? "en";
        const payloadObj = typeof msg.payload === "string"
            ? JSON.parse(msg.payload)
            : msg.payload;
        const languageCode = payloadObj?.Language ?? defaultLangaugeCode;
        payload["languageForSession"] = languageCode;
        if (personContactList) {
            personName = personContactList.username;
        }
        const channel = msg.channel;

        if (msg.type === "template") {
            payload["templateName"] = msg.templateName;
            if (msg.agentName !== 'postman') {
                msg.message = JSON.parse(msg.message);
            }
            payload["variables"] = msg.message.Variables;

            // let languageForSession = languageCode;
            if (msg.agentName !== 'postman') {
                if (typeof msg.message.Variables === "string") {
                    msg.message.Variables = JSON.parse(msg.message.Variables);
                }
            }
            if (msg.message.Variables[`${languageCode}`]) {
                payload["variables"] = msg.message.Variables[`${languageCode}`];
            } else {

                // languageForSession = languageCode;
                payload["variables"] = msg.message.Variables[languageCode];
            }

            // Fetch image URL in template message
            if (msg.message.Url) {
                payload["headers"] = {
                    "type"  : "image",
                    "image" : {
                        "link" : msg.message.Url
                    } };
            }

            // Update template name for whatsapp wati other than english
            if (channel === "whatsappWati" && languageCode !== "en") {
                payload["templateName"] = `${msg.templateName}_${languageCode}`;
            }
            payload["variables"] = await this.updatePatientName(payload["variables"], personName);
        }
        else if (msg.type === "text") {

            msg.message = await msg.message.replace("PatientName", msg.payload.PersonName ?? personName);
            msg.message = await this.translate.translatePushNotifications( msg.message, msg.userId);
            msg.message = msg.message[0];
        }
        else if (msg.type === "interactivebuttons") {
            payload = await sendApiButtonService(msg.payload);
        }
        else if (msg.type === "reancareAssessment") {
            
            // make compatible for telegram also.
            const { updatedPayload, assessmentSessionLogs } = await this.serveAssessmentService.startAssessment( msg.userId,msg.channel, msg.payload, languageCode);
            if (updatedPayload["channel"] === 'whatsappMeta' || updatedPayload["channel"] === 'WhatsappWati') {
                messageType = msg.type;
                msg.type = 'template';
                payload = updatedPayload;
            } else if (updatedPayload["channel"] === 'telegram' || updatedPayload["channel"] === 'Telegram') {
                messageType = msg.type;
                msg.message = updatedPayload["messageText"];
                msg.type = 'inline_keyboard';
                msg.payload = updatedPayload["buttonIds"];
            }
            assessmentSession = assessmentSessionLogs;
            console.log(`assessment record ${JSON.stringify(payload)}`);
            
        }
        if (msg.type === "inline_keyboard") {
            
            payload = await sendTelegramButtonService(msg.payload);
        }
        if (msg.message.ButtonsIds != null && channel !== "telegram" && channel !== "Telegram") {
            if (channel === "whatsappWati"){
                payload["buttonIds"] = await watiTemplateButtonService(msg.message.ButtonsIds);
            } else {
                payload["buttonIds"] = await templateButtonService(msg.message.ButtonsIds);
            }

        }
        if (msg?.type === 'reancareAssessmentWithForm') {
            console.log("Processing reancareAssessmentWithForm..");
            const whatsappFormMetadata = await this.getFormPayload(msg?.payload);
            payload = { ...payload, ...(whatsappFormMetadata || {}) };
            console.log("ReancareAssessmentWithForm payload:", JSON.stringify(payload, null, 2));
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
        const customRemSetting: boolean = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CUSTOM_REM_SETTING") === "true";
        if (msg.agentName === 'Reancare' && customRemSetting) {
            try {
                const msg_id = await platformMessageService.getMessageIdFromResponse(message_to_platform);
                const reminder_info = {
                    userId         : msg.payload?.userId,
                    MessageId      : msg_id,
                    ReminderId     : msg.payload?.ReminderId,
                    ReminderDate   : msg.payload?.ReminderDate,
                    ReminderTime   : msg.payload?.ReminderTime,
                    ParentActionId : msg.payload?.ParentActionId
                };
                await reminderMessage.create(reminder_info);
            } catch (error) {
                console.error("Failed to insert into reminderMessage:", error);
            }
        }
        if (messageType === "reancareAssessment") {
            
            assessmentSession.userMessageId = platformMessageService.getMessageIdFromResponse(message_to_platform);
            const Assessmentkey = `${response_format.sessionId}:Assessment:${assessmentSession.assesmentId}`;
            CacheMemory.set(Assessmentkey,assessmentSession.userMessageId);
            const AssessmentSessionRepo = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);

            const assessmentSessionData = await AssessmentSessionRepo.create(assessmentSession);
            const assessmentIdentifierObj = {
                assessmentSessionId : assessmentSessionData.autoIncrementalID,
                identifier          : assessmentSession.identifiers,
                userResponseType    : assessmentSessionData.userResponseType
            };
            const AssessmentIdentifiersRepo = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(AssessmentIdentifiers);
            await AssessmentIdentifiersRepo.create(assessmentIdentifierObj);
        }
        if (msg.provider === "REAN_BOT" || msg.provider === "GGHN" && message_to_platform.statusCode === 200) {
            const previousMessageContextID = message_to_platform.body.messages[0].id;
            const appRecord = await reminderMessage.findOne({
                where      : { MessageId: previousMessageContextID },
                attributes : ['ParentActionId'],
                raw        : true
            });
            const appointment_id = appRecord ? appRecord.ParentActionId : null;
            const docProcessBaseURL = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DOCUMENT_PROCESSOR_BASE_URL");
            
            //let todayDate = new Date().toISOString()
            //  .split('T')[0];
            //todayDate = Helper.removeLeadingZerosFromDay(todayDate);
            //const client = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            //const messageId = await platformMessageService.getMessageIdFromResponse(message_to_platform);
            //const phoneNumber = Helper.formatPhoneForDocProcessor(msg.userId);

            //const apiUrl = `${docProcessBaseURL}appointment-schedules/${client}/appointment-status/${phoneNumber}/days/${todayDate}`;
            const apiUrl = `${docProcessBaseURL}appointment-schedules/${appointment_id}/reminder-response`;
            const headers = { headers : {
                'Content-Type' : 'application/json',
                Accept         : 'application/json',
            }
            };
            const obj = {
                channel_message_id : previousMessageContextID,
                replied_status     : "Not replied"
            };
            await needle("put", apiUrl, obj, headers);

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

        if (respContactList.length === 0) {
            await contactListRepository.create({
                mobileNumber : messagetoDialogflow.platformId,
                username     : messagetoDialogflow.name,
                platform     : messagetoDialogflow.platform,
                optOut       : "false" });
        }

        //start or continue a session
        if (respChatSession.length === 0 || respChatSession[respChatSession.length - 1].sessionOpen === "false") {

            await chatSessionRepository.create({ userPlatformID  : messagetoDialogflow.platformId,
                platform        : messagetoDialogflow.platform, sessionOpen     : "true",
                lastMessageDate : lastMessageDate, askForFeedback  : "false" });
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
        } catch (error) {
            console.log(error);
        }
    }

    async updatePatientName(variables: any, personName: string){
        try {
            if (variables.length !== 0) {
                const variableName = variables[0].text;
                if (variableName === "PatientName") {
                    variables[0].text = personName;
                } else {
                    Logger.instance().log("Patient name is already updated.");
                }
            } else {
                Logger.instance().log("Template message variable is empty.");
            }
            return variables;
        } catch (error) {
            console.log(error);
        }
    }

    private getFormPayload = async(payload: string) => {
        try {
            if (!payload) {
                throw new Error(`Error in getFormPayload: payload is null`);
            }
            const payloadObj = JSON.parse(payload);
            const formMetadata = payloadObj.Metadata as WhatsAppFlowTemplateRequest | undefined;

            if (!formMetadata) {
                throw new Error(`Error in getFormPayload: whatsappFormMetadata is null`);
            }

            return {
                type     : "template",
                template : {
                    name     : formMetadata.TemplateName,
                    language : {
                        code : formMetadata?.TemplateLanguage || 'en'
                    },
                    components : [
                        formMetadata?.FlowActionData?.Component ?? null,

                        // formMetadata?.Component ?? null,
                        {
                            type       : "button",
                            sub_type   : "flow",
                            index      : "0",
                            parameters : [
                                {
                                    type   : "action",
                                    action : {
                                        flow_token : formMetadata?.FlowToken || 'unused',

                                        // flow_action_data : {
                                        //     ...formMetadata?.FlowActionData || {}
                                        // }
                                    }
                                }
                            ]

                        }
                    ].filter(Boolean)
                },
            };
        } catch (error) {
            console.log(`Error in getWhatsappFormMetadataPayload: ${error} payload: ${payload}`);
            return null;
        }
    };

}
