/* eslint-disable max-len */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DialogflowResponseService } from './dialogflow.response.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { translateService } from './translate.service';
import { container, inject, Lifecycle, scoped } from 'tsyringe';
import { Imessage } from '../refactor/interface/message.interface';
import { ChatSession } from '../models/chat.session';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { OpenAIResponseService } from './openai.response.service';
import { IserviceResponseFunctionalities } from "./response.format/response.interface";
import { CustomMLModelResponseService } from './custom.ml.model.response.service';
import { EmojiFilter } from './filter.message.for.emoji.service';
import { FeedbackService } from "./feedback/feedback.service";
import { OutgoingMessage } from '../refactor/interface/message.interface';
import { ServeAssessmentService } from './maternalCareplan/serveAssessment/serveAssessment.service';
import { CacheMemory } from './cache.memory.service';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { WorkflowEventListener } from './emergency/workflow.event.listener';
import { MessageHandlerType } from '../refactor/messageTypes/message.types';
import { CommonAssessmentService } from './Assesssment/common.assessment.service';
import { AssessmentHandlingService } from './Assesssment/assessment.handling.service';
import { FormHandler } from './form/form.handler';

///////////////////////////////////////////////////////////////////////////////////////

@scoped(Lifecycle.ContainerScoped)
export class handleRequestservice {

    constructor(
        @inject(WorkflowEventListener) private workflowEventListener?: WorkflowEventListener,
        @inject(DialogflowResponseService) private DialogflowResponseService?: DialogflowResponseService,
        @inject(translateService) private translateService?: translateService,
        @inject(EmojiFilter) private emojiFilter?: EmojiFilter,
        @inject(FeedbackService) private feedbackService?: FeedbackService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(OpenAIResponseService) private openAIResponseService?: OpenAIResponseService,
        @inject(CustomMLModelResponseService) private customMLModelResponseService?: CustomMLModelResponseService,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(CommonAssessmentService) private commonAssessmentService?: CommonAssessmentService,
        @inject(AssessmentHandlingService) private assessmentHandlingService?: AssessmentHandlingService
    ) {
    }

    async handleUserRequest(message: Imessage, channel: string) {
        const UserPlatformID = message.platformId;
        const ContextID = message.contextId;

        //get the translated message
        const translate_message = await this.translateService.translateMessage(message.type, message.messageBody, UserPlatformID);

        let message_from_nlp: IserviceResponseFunctionalities = null;
        const nlpService = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NLP_SERVICE");
        const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

        if (nlpService && nlpService === "openai") {
            message_from_nlp = await this.openAIResponseService.getOpenaiMessage(clientName, translate_message.message);
        }
        else if (nlpService && nlpService === "custom_ml_model") {

            let message_to_ml_model = translate_message.message;

            if (message.contextId) {
                const tag = "Feedback";
                await this.feedbackService.recordFeedback(message.messageBody, ContextID, tag);
                message_to_ml_model = "I have send the Feedback";
            }

            else if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("NLP_TRANSLATE_SERVICE")) {
                message_to_ml_model = message.messageBody;
            }

            message_from_nlp = await this.customMLModelResponseService.getCustomModelResponse(message_to_ml_model, channel, message);

        } else {
            // eslint-disable-next-line max-len
            message_from_nlp = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, channel, message.intent, message);
            if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("OPENAI_API_KEY")) {
                if (message_from_nlp.getIntent() === "Default Fallback Intent") {
                    message_from_nlp = await this.openAIResponseService.getOpenaiMessage(clientName, translate_message.message);
                }
            }
            console.log("message_from_nlp", message_from_nlp);

        }

        // this.getTranslatedResponse(message_from_dialoglow, translate_message.languageForSession);
        // process the message from dialogflow before sending it to whatsapp
        const processed_message = await this.processMessage(message_from_nlp, UserPlatformID, null);

        return { processed_message, message_from_nlp };
    }

    getTranslatedResponse(message_from_nlp, languageForSession) {
        let customTranslations = null;
        const payload = message_from_nlp.getPayload();
        if (payload) {
            if (payload.fields.customTranslations) {
                customTranslations = payload.fields.translations.structValue.fields[languageForSession].stringValue;
            }
        }
        return customTranslations;
    }

    async processMessage(message_from_nlp, platformId, messageHandler = null) {
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const languagefromdb = await chatSessionRepository.findAll({
            where : {
                userPlatformID : platformId,
                sessionOpen    : 'true'
            }
        });
        const languageForSession = languagefromdb[languagefromdb.length - 1].preferredLanguage;
        const customTranslations = [this.getTranslatedResponse(message_from_nlp, languageForSession)];
        if (customTranslations[0] === null) {
            let googleTranslate;
            if (messageHandler === "QnA") {
                if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("NLP_TRANSLATE_SERVICE") === "llm") {
                    googleTranslate = message_from_nlp.getText();
                }
                else {
                    googleTranslate = await this.translateService.processdialogflowmessage(message_from_nlp, languageForSession);
                }
            } else {
                googleTranslate = await this.translateService.processdialogflowmessage(message_from_nlp, languageForSession);
            }

            console.log("googleTranslate", googleTranslate);
            return googleTranslate;
        }
        else {
            console.log("customTranslations", customTranslations);
            return customTranslations;
        }
    }

    async handleUserRequestForRouting(outgoingMessage: OutgoingMessage, eventObj: platformServiceInterface) {
        const metaData = outgoingMessage.MetaData;
        const messageHandler = outgoingMessage.PrimaryMessageHandler;
        let message_from_nlp: IserviceResponseFunctionalities = null;
        let processed_message = '';

        switch (messageHandler) {

        case 'NLP': {
            message_from_nlp = outgoingMessage.Intent.IntentContent;

            // message_from_nlp = await this.DialogflowResponseService.getDialogflowMessage(metaData.messageBody, metaData.platform, metaData.intent, metaData);
            break;
        }
        case 'QnA': {
            message_from_nlp = await this.customMLModelResponseService.getCustomModelResponse(metaData.messageBody, metaData.platform, metaData);
            break;
        }
        case 'Assessments': {
            const key = `${metaData.platformId}:Assessment:${outgoingMessage.Assessment.AssessmentId}`;
            const userCacheData = await CacheMemory.get(key);
            if (userCacheData) {
                console.log("user response",metaData.messageBody);
                message_from_nlp = await this.serveAssessmentService.answerQuestion(eventObj, metaData.platformId, metaData.originalMessage, userCacheData, metaData.platform, true,metaData.intent, metaData);
                console.log(`after calling answer question service, message: ${message_from_nlp.getText()}`);
            } else {
                outgoingMessage.MetaData["eventObj"] = eventObj;
                message_from_nlp = await this.assessmentHandlingService.initialiseAssessment(outgoingMessage, outgoingMessage.Assessment.AssessmentId, eventObj);
            }
            break;
        }
        case MessageHandlerType.AssessmentWithFormSubmission: {
            try {
                console.log("Handling case AssessmentWithFormSubmission", outgoingMessage);
                const formHandle = container.resolve(FormHandler);
                await formHandle.handleFormSubmission(outgoingMessage);
            } catch (error) {
                console.log("Error handling form submission", error);
            }
            break;
        }
        case 'Feedback': {
            let messageToMlModel = null;
            if (metaData.contextId && !metaData.intent) {
                let tag = "null";
                tag = (metaData.type === "reaction") ? "reaction" : "Feedback";
                await this.feedbackService.recordFeedback(outgoingMessage.Feedback.FeedbackContent, metaData.contextId, tag);
                if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("FEEDBACK_PROMPT")) {
                    const feedbackPrompt = this.clientEnvironmentProviderService.getClientEnvironmentVariable("FEEDBACK_PROMPT");
                    messageToMlModel = feedbackPrompt + outgoingMessage.Feedback.FeedbackContent;
                } else {
                    messageToMlModel = "I have sent feedback to your message tell me that : we have acknowledged your feedback out team of experts will come back to you";
                }
                message_from_nlp = await this.customMLModelResponseService.getCustomModelResponse(messageToMlModel, metaData.platform, metaData);
            } else {
                messageToMlModel = outgoingMessage.Feedback.FeedbackContent;
                message_from_nlp = await this.DialogflowResponseService.getDialogflowMessage(messageToMlModel, metaData.platform, metaData.intent, metaData);
            }
            break;
        }
        case 'Custom': {
            break;
        }
        case 'Unhandled': {
            break;
        }
        case MessageHandlerType.WorkflowService: {
            console.log("Workflow service event .....");
            const result = await this.workflowEventListener.commence(metaData, eventObj);
            if (!result) {
                console.log("Unable to process Workflow event listener event.");
            }
            break;
        }
        }
        if (outgoingMessage.PrimaryMessageHandler !== MessageHandlerType.WorkflowService && message_from_nlp) {
            processed_message = await this.processMessage(message_from_nlp, metaData.platformId, messageHandler);
        }

        return { message_from_nlp, processed_message };
    }

}
