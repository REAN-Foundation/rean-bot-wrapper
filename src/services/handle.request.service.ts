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
import { MessageHandlerType, NlpProviderType } from '../refactor/messageTypes/message.types';
import { CommonAssessmentService } from './Assesssment/common.assessment.service';
import { AssessmentHandlingService } from './Assesssment/assessment.handling.service';
import { FormHandler } from './form/form.handler';
import { CareplanEnrollmentService } from './basic.careplan/careplan.enrollment.service';
import { EntityCollectionOrchestrator } from './llm/entity.collection/entity.collection.orchestrator.service';
import { IntentEmitter } from '../intentEmitters/intent.emitter';
import { ContainerService } from './container/container.service';
import { LLMIntentRegistry } from '../intentEmitters/llm/llm.intent.registry';
import { LLMEventObject, LLMListenerResponse } from '../refactor/interface/llm/llm.event.interfaces';
import { IntentResponseService } from './llm/intent.response.service';
import { PlatformPayloadBuilder, FormattedButton } from './platform.payload.builder.service';

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
        @inject(AssessmentHandlingService) private assessmentHandlingService?: AssessmentHandlingService,
        @inject(EntityCollectionOrchestrator) private entityCollectionOrchestrator?: EntityCollectionOrchestrator,
        @inject(IntentResponseService) private intentResponseService?: IntentResponseService
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
            }
            else if (messageHandler === "Assessments") {
                googleTranslate = message_from_nlp.getText();
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
            // Check if this is an LLM-classified intent or Dialogflow
            if (outgoingMessage.Intent.NLPProvider === NlpProviderType.LLM) {
                // LLM classified intent - trigger intent listener directly
                console.log(`[HandleRequestService] Processing LLM classified intent: ${outgoingMessage.Intent.IntentName}`);
                message_from_nlp = await this.handleLLMClassifiedIntent(outgoingMessage, metaData);
            } else {
                // Dialogflow response - use existing flow
                message_from_nlp = outgoingMessage.Intent.IntentContent;
            }
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
                console.log(`after calling answer question service, message: ${message_from_nlp?.getText()}`);
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

            // This is the matching schema id from the llm service
            const workflowId = outgoingMessage.Alert.AlertId;
            const result = await this.workflowEventListener.commence(metaData, eventObj, workflowId);
            if (!result) {
                console.log("Unable to process Workflow event listener event.");
            }
            break;
        }

        case MessageHandlerType.BasicCareplan: {
            try {
                console.log("Basic careplan enrollment message handler processing...");
                await CareplanEnrollmentService.enrollPatient(
                    outgoingMessage.BasicCareplan?.TenantName,
                    outgoingMessage.BasicCareplan?.Channel,
                    outgoingMessage.MetaData,
                    outgoingMessage.BasicCareplan);
            } catch (error) {
                console.log("Error in Basic careplan enrollment:", error);
            }
            break;
        }

        case MessageHandlerType.EntityCollection: {
            try {
                console.log("[HandleRequestService] Processing entity collection...");
                message_from_nlp = await this.handleEntityCollection(outgoingMessage, metaData);
            } catch (error) {
                console.error("[HandleRequestService] Error in entity collection, falling back to Dialogflow:", error);
                // Fallback to Dialogflow on error
                message_from_nlp = await this.DialogflowResponseService.getDialogflowMessage(
                    metaData.messageBody,
                    metaData.platform,
                    metaData.intent,
                    metaData
                );
            }
            break;
        }
        }
        if (outgoingMessage.PrimaryMessageHandler !== MessageHandlerType.WorkflowService && message_from_nlp) {
            processed_message = await this.processMessage(message_from_nlp, metaData.platformId, messageHandler);
        }

        return { message_from_nlp, processed_message };
    }

    /**
     * Handle LLM classified intent using database-driven IntentResponseService
     */
    private async handleLLMClassifiedIntent(
        outgoingMessage: OutgoingMessage,
        metadata: Imessage
    ): Promise<IserviceResponseFunctionalities> {
        try {
            const intentName = outgoingMessage.Intent.IntentName;
            const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            const childContainer = ContainerService.createChildContainer(clientName);

            console.log(`[HandleRequestService] Processing LLM classified intent: ${intentName}`);

            // Create LLMEventObject for the intent
            const llmEvent = this.createLLMEventObject(
                intentName,
                metadata,
                outgoingMessage.Intent.IntentContent?.entities || {},
                'llm_classification',
                childContainer,
                outgoingMessage.Intent.IntentContent
            );

            // Use IntentResponseService to handle the intent (static/listener/hybrid)
            const result = await this.intentResponseService.processIntent(
                intentName,
                llmEvent,
                childContainer
            );

            console.log(`[HandleRequestService] Intent response type: ${result.responseType}, Success: ${result.success}`);

            if (result.success) {
                // Pass buttons to createResponseFromMessage - they'll be converted to Dialogflow-compatible payload
                if (result.buttons && result.buttons.length > 0) {
                    console.log(`[HandleRequestService] Intent has ${result.buttons.length} buttons`);
                }

                return this.createResponseFromMessage(result.message, intentName, result.buttons);
            } else {
                console.log(`[HandleRequestService] Intent processing failed: ${result.message}`);

                // Fallback to Dialogflow
                return await this.DialogflowResponseService.getDialogflowMessage(
                    metadata.messageBody,
                    metadata.platform,
                    intentName,
                    metadata
                );
            }
        } catch (error) {
            console.error('[HandleRequestService] Error handling LLM classified intent:', error);
            return await this.DialogflowResponseService.getDialogflowMessage(
                metadata.messageBody,
                metadata.platform,
                metadata.intent,
                metadata
            );
        }
    }

    /**
     * Create LLMEventObject for LLM-native listeners
     */
    private createLLMEventObject(
        intentCode: string,
        metadata: Imessage,
        entities: Record<string, any>,
        source: 'llm_classification' | 'entity_collection' | 'button',
        childContainer: any,
        classificationResult?: any
    ): LLMEventObject {
        // Convert entities to EntityValue format
        const formattedEntities: Record<string, { value: any; rawValue?: string; confidence?: number }> = {};
        for (const [key, value] of Object.entries(entities)) {
            if (typeof value === 'object' && value !== null && 'value' in value) {
                formattedEntities[key] = value;
            } else {
                formattedEntities[key] = { value };
            }
        }

        return {
            intentCode,
            userId    : metadata.platformId,
            sessionId : metadata.contextId || `session_${Date.now()}`,
            channel   : metadata.platform,
            message   : {
                text      : metadata.messageBody,
                type      : metadata.type,
                timestamp : new Date(),
                platformId: metadata.platformId
            },
            entities  : formattedEntities,
            source,
            classification: classificationResult ? {
                confidence: classificationResult.confidence || 0,
                provider  : classificationResult.provider || 'llm',
                model     : classificationResult.model || ''
            } : undefined,
            container : childContainer
        };
    }

    /**
     * Handle entity collection flow
     */
    private async handleEntityCollection(
        outgoingMessage: OutgoingMessage,
        metadata: Imessage
    ): Promise<IserviceResponseFunctionalities> {
        try {
            const entityCollectionData = outgoingMessage.EntityCollection;

            let response;

            if (entityCollectionData.isActive) {
                // Continue existing session
                console.log(`[HandleRequestService] Continuing entity collection session: ${entityCollectionData.sessionId}`);
                response = await this.entityCollectionOrchestrator.processMessage(
                    entityCollectionData.sessionId,
                    metadata.messageBody
                );
            } else {
                // Start new session
                console.log(`[HandleRequestService] Starting entity collection for intent: ${entityCollectionData.intentCode}`);
                response = await this.entityCollectionOrchestrator.startSession(
                    entityCollectionData.intentCode,
                    metadata.platformId,
                    entityCollectionData.sessionId,
                    metadata.messageBody
                );
            }

            // Check if entity collection is complete
            if (response.isComplete && response.collectedEntities) {
                // Entity collection complete, trigger intent with collected entities
                console.log(`[HandleRequestService] Entity collection complete, triggering intent: ${entityCollectionData.intentCode}`);
                return await this.triggerIntentWithCollectedEntities(
                    entityCollectionData.intentCode,
                    response.collectedEntities,
                    metadata
                );
            } else if (!response.shouldContinue) {
                // Entity collection abandoned or timed out, fallback to Dialogflow
                console.log('[HandleRequestService] Entity collection failed, falling back to Dialogflow');
                return await this.fallbackToDialogflow(metadata);
            } else {
                // Entity collection in progress, return question to user
                console.log(`[HandleRequestService] Entity collection in progress: ${response.message}`);
                return this.createResponseFromMessage(response.message, entityCollectionData.intentCode);
            }
        } catch (error) {
            console.error('[HandleRequestService] Error in entity collection:', error);
            throw error;
        }
    }

    /**
     * Trigger intent with collected entities
     */
    private async triggerIntentWithCollectedEntities(
        intentCode: string,
        collectedEntities: Map<string, any>,
        metadata: Imessage
    ): Promise<IserviceResponseFunctionalities> {
        try {
            const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            const childContainer = ContainerService.createChildContainer(clientName);

            // Convert entities Map to parameters object
            const parameters = this.convertEntitiesToParameters(collectedEntities);

            console.log(`[HandleRequestService] Triggering intent: ${intentCode} with entities:`, Array.from(collectedEntities.keys()));

            // Convert Map to Record for LLMEventObject
            const entityRecord: Record<string, { value: any; rawValue?: string; confidence?: number }> = {};
            collectedEntities.forEach((entity, name) => {
                if (typeof entity === 'object' && entity !== null && 'value' in entity) {
                    entityRecord[name] = entity;
                } else {
                    entityRecord[name] = { value: entity };
                }
            });

            // Create LLMEventObject for entity collection flow
            const llmEvent = this.createLLMEventObject(
                intentCode,
                metadata,
                entityRecord,
                'entity_collection',
                childContainer
            );

            // Use IntentResponseService to handle the intent (static/listener/hybrid)
            const result = await this.intentResponseService.processIntent(
                intentCode,
                llmEvent,
                childContainer
            );

            console.log(`[HandleRequestService] Intent response type: ${result.responseType}, Success: ${result.success}`);

            if (result.success) {
                // Pass buttons to createResponseFromMessage - they'll be converted to Dialogflow-compatible payload
                if (result.buttons && result.buttons.length > 0) {
                    console.log(`[HandleRequestService] Intent has ${result.buttons.length} buttons`);
                }

                return this.createResponseFromMessage(result.message, intentCode, result.buttons);
            } else {
                const errorMessage = `I've recorded your ${intentCode} successfully.`;
                return this.createResponseFromMessage(errorMessage, intentCode);
            }
        } catch (error) {
            console.error('[HandleRequestService] Error triggering intent:', error);
            throw error;
        }
    }

    /**
     * Convert entities Map to parameters object
     */
    private convertEntitiesToParameters(entities: Map<string, any>): any {
        const parameters = {};
        entities.forEach((entity, name) => {
            parameters[name] = entity.value;
        });
        return parameters;
    }

    /**
     * Fallback to Dialogflow
     */
    private async fallbackToDialogflow(metadata: Imessage): Promise<IserviceResponseFunctionalities> {
        console.log('[HandleRequestService] Falling back to Dialogflow for intent detection');
        return await this.DialogflowResponseService.getDialogflowMessage(
            metadata.messageBody,
            metadata.platform,
            metadata.intent,
            metadata
        );
    }

    /**
     * Create a response object from a message string
     * Matches the IserviceResponseFunctionalities interface used by DialogflowResponseFormat
     *
     * @param message - The message text to send
     * @param intent - The intent name
     * @param buttons - Optional buttons to include (converted to Dialogflow-compatible payload)
     * @returns IserviceResponseFunctionalities object compatible with existing platform services
     */
    private createResponseFromMessage(
        message: string,
        intent: string,
        buttons?: FormattedButton[]
    ): IserviceResponseFunctionalities {
        // Build Dialogflow-compatible payload if buttons exist
        const payload = buttons && buttons.length > 0
            ? PlatformPayloadBuilder.buildButtonPayload(buttons)
            : null;

        return {
            getText        : () => [message],  // Must be string array for translateService compatibility
            getIntent      : () => intent,
            getSensitivity : () => null,
            getPayload     : () => payload,    // Returns button payload in Dialogflow format
            getImageObject : () => ({ url: "", caption: "" }),
            getParseMode   : () => null,
            getSimilarDoc  : () => null
        };
    }

}
