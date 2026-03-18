/* eslint-disable max-len */
/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-var-requires */
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { CommaSeparatedListOutputParser } from "langchain/schema/output_parser";
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Imessage, OutgoingMessage } from "../../refactor/interface/message.interface";
import { FeedbackService } from "../feedback/feedback.service";
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import { MessageHandlerType, NlpProviderType, UserFeedbackType, ChannelType } from "../../refactor/messageTypes/message.types";
import { EmojiFilter } from "../filter.message.for.emoji.service";
import { DialogflowResponseService } from '../dialogflow.response.service';
import { CacheMemory } from "../cache.memory.service";
import { Intents } from "../../models/intents/intents.model";
import { AssessmentSessionLogs } from "../../models/assessment.session.model";
import { NeedleService } from "../needle.service";
import { AssessmentService } from "../Assesssment/assessment.service";
import { AssessmentIdentifiers } from "../../models/assessment/assessment.identifiers.model";
import { WorkflowEventListener } from "../emergency/workflow.event.listener";
import { WorkflowRoutingService } from "../workflow/workflow.routing.service";
import { RoutingDecision, Schema } from '../../refactor/interface/workflow/workflow.interface';
import { IntentType } from "../../domain.types/intents/intents.types";
import { ContainerService } from "../container/container.service";
import { IntentRepo } from "../../database/repositories/intent/intent.repo";
import { CareplanEnrollmentDomainModel } from "../../domain.types/basic.careplan/careplan.types";
import { CareplanMetaDataValidator } from "../basic.careplan/careplan.metadata.validator";
import { NotificationType } from "../../domain.types/reminder/reminder.domain.model";
import { EntityCollectionOrchestrator } from "../llm/entity.collection/entity.collection.orchestrator.service";
import { EntityCollectionSessionRepo } from "../../database/repositories/llm/entity.collection.session.repo";
import { FeatureFlagService } from "../feature.flags/feature.flag.service";
import { SessionState } from "../../refactor/interface/llm/entity.collection.interfaces";
import { LLMIntentClassificationService } from "../llm/llm.intent.classification.service";
import { IntentResponseService } from "../llm/intent.response.service";

////////////////////////////////////////////////////////////////////////////////////

@scoped(Lifecycle.ContainerScoped)
export class DecisionRouter {

    outgoingMessage!: OutgoingMessage;

    constructor(
        @inject(DialogflowResponseService) private dialogflowResponseService?: DialogflowResponseService,
        @inject(FeedbackService) private feedbackService?: FeedbackService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private environmentProviderService?: ClientEnvironmentProviderService,
        @inject(EmojiFilter) private emojiFilter?: EmojiFilter,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(AssessmentService) private assessmentService?: AssessmentService,
        @inject(WorkflowEventListener) private workflowEventListener?: WorkflowEventListener,
        @inject(WorkflowRoutingService) private workflowRoutingService?: WorkflowRoutingService,
        @inject(FeatureFlagService) private featureFlagService?: FeatureFlagService,
        @inject(EntityCollectionOrchestrator) private entityCollectionOrchestrator?: EntityCollectionOrchestrator,
        @inject(LLMIntentClassificationService) private llmIntentClassificationService?: LLMIntentClassificationService,
        @inject(IntentResponseService) private intentResponseService?: IntentResponseService
    ) {
        this.outgoingMessage = {
            PrimaryMessageHandler : MessageHandlerType.Unhandled,
            MetaData              : {
                name              : "",
                platform          : "",
                platformId        : "",
                chat_message_id   : "",
                direction         : "",
                type              : "",
                messageBody       : "",
                imageUrl          : "",
                latlong           : "",
                replyPath         : "",
                intent            : "",
                responseMessageID : "",
                contextId         : ""
            },
            Intent : {
                NLPProvider : NlpProviderType.LLM,
                IntentName  : ''
            },
            Assessment : {
                AssessmentId   : '',
                AssessmentName : '',
                TemplateId     : ''
            },
            QnA : {
                NLPProvider : NlpProviderType.LLM,
                UserQuery   : ''
            },
            Feedback : {

            },
            Alert : {
            }

        };
    }

    /** Lazy ChatOpenAI using tenant API key (avoids construction-time env requirement). */
    private async getModel(): Promise<ChatOpenAI> {
        const apiKeySetting = await this.environmentProviderService.getClientEnvironmentVariable("OpenAiApiKey");
        const apiKey = apiKeySetting?.Value ?? process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI or Azure OpenAI API key not found. Set OpenAiApiKey in tenant secrets or OPENAI_API_KEY in .env.");
        }
        return new ChatOpenAI({
            temperature : 0,
            modelName   : "gpt-3.5-turbo",
            openAIApiKey: apiKey
        });
    }

    public feedbackFlag = false;

    public assessmentFlag = false;

    public intentFlag = false;

    async checkFeedback(messageBody: Imessage, channel: string){

        // Check if message is feedback or not
        console.log(`Checking feedback for ${channel}`);
        let feedbackType = '';
        let feedback = '';
        if (messageBody.contextId && !messageBody.intent){
            this.feedbackFlag = true;
            feedbackType = UserFeedbackType.General;
            feedback = messageBody.messageBody;
        } else {
            feedback = await this.emojiFilter.checkForEmoji(messageBody.messageBody);
            if (feedback === 'PositiveFeedback'){
                feedbackType = UserFeedbackType.Positive;
                this.feedbackFlag = true;
            } else if (feedback === 'NegativeFeedback') {
                feedbackType = UserFeedbackType.Negative;
                this.feedbackFlag = true;
            }
        }
        const feedbackObj = {
            feedbackType   : feedbackType,
            feedbackFlag   : this.feedbackFlag,
            messageContent : feedback
        };
        return feedbackObj;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async checkAssessment(messageBody: Imessage, channel: string) {
        try {

            const assessmentData = {
                AssessmentId   : '',
                AssessmentName : '',
                TemplateId     : '',
                CurrentNodeId  : '',
                Question       : '',
                AssessmentFlag : false,
                QuestionData   : null,
                MetaData       : {
                    "assessmentStart"  : false,
                    "askQuestionAgain" : false
                }
            };
            let messageContextId: string | null = null;
            if (channel === "telegram" || channel === "Telegram") {
                messageContextId = messageBody.chat_message_id;
            } else {
                messageContextId = messageBody.contextId;
            }
            const intent = messageBody.intent;
            const AssessmentSession =
            (await this.entityManagerProvider.getEntityManager(this.environmentProviderService))
                .getRepository(AssessmentSessionLogs);

            const intentRepository = (
                (await this.entityManagerProvider.getEntityManager(this.environmentProviderService))
                    .getRepository(Intents)
            );

            let assessmentResponse = null;
            if (messageContextId) {
                assessmentResponse = await AssessmentSession.findOne({
                    where : {
                        userMessageId : messageContextId
                    },
                    order : [['createdAt', 'DESC']],
                });

                // Add null check for assessmentResponse
                if (!assessmentResponse){
                    assessmentResponse = await AssessmentSession.findOne({
                        where : {
                            userPlatformId : messageBody.platformId
                        },
                        order : [['createdAt', 'DESC']],
                    });
                }
            } else {
                assessmentResponse = await AssessmentSession.findOne({
                    where : {
                        userPlatformId : messageBody.platformId
                    },
                    order : [['createdAt', 'DESC']]
                });
            }

            let key;
            if (assessmentResponse) {
                key = `${messageBody.platformId}:NextQuestionFlag:${assessmentResponse.assesmentId}`;
            } else {
                key = '';
            }

            const nextQuestionFlag = await CacheMemory.get(key);

            // Currently will only support the assessment start through buttons
            if (
                messageContextId &&
                messageBody.intent &&
                !nextQuestionFlag
            ) {

                const matchingIntents = await intentRepository.findOne({
                    where : {
                        code : intent,
                        type : IntentType.Assessment
                    }
                });

                if (matchingIntents) {

                    // we will call the reancare api here
                    const assessmentCode = matchingIntents.dataValues.code;
                    assessmentData.AssessmentId = assessmentCode;
                    assessmentData.AssessmentName = matchingIntents.dataValues.name;
                    assessmentData.MetaData.assessmentStart = true;
                    assessmentData.AssessmentFlag = true;
                } else {

                    // here we will create the false flag and return object
                    assessmentData.AssessmentFlag = false;
                }
            } else {
                if (nextQuestionFlag) {
                    if (nextQuestionFlag === true) {
                        assessmentData.AssessmentFlag = true;
                        assessmentData.AssessmentId = assessmentResponse.assesmentId;

                        // await CacheMemory.set(key, false);
                    }
                } else {
                    assessmentData.AssessmentFlag = false;
                }
            }

            if (assessmentData.AssessmentFlag && !assessmentData.MetaData.assessmentStart) {
                const AssessmentIdentifiersRepo = (
                    await this.entityManagerProvider.getEntityManager(this.environmentProviderService)
                ).getRepository(AssessmentIdentifiers);

                // Add null check for assessmentResponse
                if (!assessmentResponse) {
                    console.log(`No assessment session found for user: ${messageBody.platformId}`);
                    assessmentData.AssessmentFlag = false;
                    return assessmentData;
                }

                const assessmentIdentifierData = await AssessmentIdentifiersRepo.findOne({
                    where : {
                        assessmentSessionId : assessmentResponse.autoIncrementalID
                    }
                });

                // Add null check for assessmentIdentifierData
                if (!assessmentIdentifierData) {
                    console.log(`No assessment identifier found for session: ${assessmentResponse.autoIncrementalID}`);
                    assessmentData.AssessmentFlag = false;
                    return assessmentData;
                }

                const assessmentResponseType = assessmentResponse.userResponseType;
                const assessmentIdentifierString = assessmentIdentifierData.identifier;

                let validationFlag = false;

                if (assessmentIdentifierString === null) {
                    validationFlag = true;

                }
                else {

                    validationFlag = await this.assessmentService.validateAssessmentResponse(
                        assessmentResponseType,
                        assessmentIdentifierString,
                        messageBody,
                        assessmentResponse.dataValues
                    );

                    if (!validationFlag) {
                        // Check if this node is required
                        const isNodeRequired = assessmentResponse.is_node_required ?? false;

                        if (isNodeRequired) {
                            // Node is required - don't allow escape
                            console.log(`[checkAssessment] Validation failed for required node ${assessmentResponse.assesmentNodeId}`);

                            // Fetch the current question from REAN API to reiterate it
                            const questionApiURL = `clinical/assessments/${assessmentResponse.assesmentId}/questions/${assessmentResponse.assesmentNodeId}`;
                            const questionResponse = await this.needleService.needleRequestForREAN("get", questionApiURL, null, null);
                            const currentQuestion = questionResponse?.Data?.Question?.Description || "Please provide your response.";

                            // Store full question data for button rendering
                            const questionData = questionResponse?.Data?.Question;

                            assessmentData.AssessmentFlag = true;  // Stay in assessment
                            assessmentData.MetaData.askQuestionAgain = true;
                            assessmentData.Question = currentQuestion;
                            assessmentData.QuestionData = questionData;

                            // Increment retry count
                            assessmentResponse.retry_count = (assessmentResponse.retry_count || 0) + 1;
                            await assessmentResponse.save();

                            return assessmentData;
                        }

                        // Node is optional - allow escape to fallback
                        assessmentData.AssessmentFlag = false;

                        if (
                            messageBody.contextId &&
                        messageBody.intent
                        ) {
                            const matchingIntents = await intentRepository.findOne({
                                where : {
                                    code : intent,
                                    type : IntentType.Assessment
                                }
                            });

                            if (matchingIntents) {

                                // we will call the reancare api here
                                const assessmentCode = matchingIntents.dataValues.code;
                                assessmentData.AssessmentId = assessmentCode;
                                assessmentData.AssessmentName = matchingIntents.dataValues.name;
                                assessmentData.MetaData.assessmentStart = true;
                                assessmentData.AssessmentFlag = true;
                            } else {

                                // here we will create the false flag and return object
                                assessmentData.AssessmentFlag = false;
                            }
                        }
                    }
                }

            }

            return assessmentData;
        } catch (error) {
            console.log('Error in checkAssessment:', error);

            // Return default assessment data with flag set to false on error
            return {
                AssessmentId   : '',
                AssessmentName : '',
                TemplateId     : '',
                CurrentNodeId  : '',
                Question       : '',
                AssessmentFlag : false,
                QuestionData   : null,
                MetaData       : {
                    "assessmentStart"  : false,
                    "askQuestionAgain" : false
                }
            };
        }

    }

    async checkCareplanEnrollment(messageBody: Imessage, channel: string){
        try {
            if (!messageBody?.intent) {
                return false;
            }
            const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
            const childContainer = ContainerService.createChildContainer(clientName);
            if (!childContainer) {
                throw new Error("Failed to create child container");
            }
            const intent = await IntentRepo.findIntentByCodeAndType(childContainer, messageBody.intent, IntentType.Careplan);
            if (!intent) {
                throw new Error(`Failed to find intent ${messageBody.intent} for careplan enrollment.`);
            }
            const metaData = JSON.parse(intent.Metadata) as CareplanEnrollmentDomainModel;
            const careplanMetaData = CareplanMetaDataValidator.validatecareplanEnrollment(metaData);

            careplanMetaData.TenantName = clientName;
            channel = channel === 'whatsappMeta' ? NotificationType.WhatsApp : channel;
            careplanMetaData.Channel = channel;
            careplanMetaData.StartDate = new Date().toISOString()
                .split('T')[0];

            return careplanMetaData;

        } catch (error) {
            console.log('Error in checkCareplanEnrollment:', error);
            return false;
        }

    }

    /**
     * Check if there's an active entity collection session for this user
     */
    private async checkActiveEntityCollectionSession(userPlatformId: string): Promise<any | null> {
        try {
            const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
            const childContainer = ContainerService.createChildContainer(clientName);

            // Check for active session in database
            const activeSession = await EntityCollectionSessionRepo.findActiveByUserPlatformId(
                childContainer,
                userPlatformId
            );

            // Session is active if it's in any of the in-progress states
            const inProgressStatuses = ['initialized', 'collecting', 'validating'];
            if (activeSession && inProgressStatuses.includes(activeSession.status as string)) {
                return activeSession;
            }

            return null;
        } catch (error) {
            console.error('[DecisionRouter] Error checking active session:', error);
            return null;
        }
    }

    /**
     * Check if intent requires entity collection
     */
    private async checkEntityCollection(messageBody: Imessage): Promise<any> {
        try {
            const entityCollectionData = {
                requiresEntityCollection : false,
                intentCode               : null,
                sessionId                : null,
                activeSession            : null,
                classifiedIntent         : null,
                llmClassification        : null
            };

            // First, check if there's an active session for this user
            const activeSession = await this.checkActiveEntityCollectionSession(messageBody.platformId);

            if (activeSession) {
                entityCollectionData.requiresEntityCollection = true;
                entityCollectionData.sessionId = activeSession.sessionId;
                entityCollectionData.intentCode = activeSession.intentCode;
                entityCollectionData.activeSession = activeSession;
                return entityCollectionData;
            }

            // No active session, determine intent code
            let intentCode: string | null = null;
            let classificationResult = null;

            if (messageBody.intent) {
                // Deterministic case: Intent from button click
                intentCode = messageBody.intent;
            } else {
                // Free text: Try LLM intent classification
                const llmClassificationEnabled = await this.featureFlagService.isEnabled(
                    'llmClassificationEnabled',
                    { userId: messageBody.platformId }
                );

                if (llmClassificationEnabled) {
                    try {
                        classificationResult = await this.llmIntentClassificationService.classifyIntent(
                            messageBody.messageBody,
                            messageBody.platformId
                        );

                        // Check confidence threshold
                        if (classificationResult && classificationResult.intentData) {
                            const threshold = classificationResult.intentData.confidenceThreshold || 0.75;

                            if (classificationResult.confidence >= threshold) {
                                intentCode = classificationResult.intent;
                                entityCollectionData.llmClassification = classificationResult;
                            } else {
                                console.log(`[DecisionRouter] LLM confidence ${classificationResult.confidence} below threshold ${threshold}, falling back to Dialogflow`);
                            }
                        }
                    } catch (error) {
                        console.error('[DecisionRouter] Error in LLM intent classification:', error);
                        // Fall back to Dialogflow by returning without intent
                    }
                }
            }

            // If we have an intent code, check if it requires entity collection
            if (intentCode) {
                const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
                const childContainer = ContainerService.createChildContainer(clientName);

                const intent = await IntentRepo.findIntentByCode(childContainer, intentCode);

                if (intent && intent.llmEnabled) {
                    // For button clicks, create llmClassification structure
                    if (messageBody.intent && !classificationResult) {
                        classificationResult = {
                            intent       : intent.code,
                            confidence   : 1.0, // Button clicks are deterministic
                            intentData   : intent,
                            entities     : {},
                            rawClassification: 'button_click'
                        };
                        entityCollectionData.llmClassification = classificationResult;
                    }

                    // Check if entity collection is required
                    if (intent.entitySchema) {
                        // Check if main entity collection flag is enabled
                        const mainFlagEnabled = await this.featureFlagService.isEnabled(
                            'llmEntityCollectionEnabled',
                            { userId: messageBody.platformId }
                        );

                        if (mainFlagEnabled) {
                            // Check if entity collection is enabled for this specific intent
                            const intentFlagName = `entityCollection_${intent.code.replace(/\./g, '_')}`;
                            const isIntentEnabled = await this.featureFlagService.isEnabled(
                                intentFlagName,
                                { userId: messageBody.platformId }
                            );

                            if (isIntentEnabled) {
                                entityCollectionData.requiresEntityCollection = true;
                                entityCollectionData.intentCode = intent.code;
                                entityCollectionData.classifiedIntent = intent;
                                // Generate new session ID
                                entityCollectionData.sessionId = `ec_${messageBody.platformId}_${Date.now()}`;
                            }
                        }
                    }
                }
            }

            return entityCollectionData;
        } catch (error) {
            console.error('[DecisionRouter] Error checking entity collection:', error);
            return {
                requiresEntityCollection : false,
                intentCode               : null,
                sessionId                : null,
                activeSession            : null,
                classifiedIntent         : null,
                llmClassification        : null
            };
        }
    }

    async checkDFIntent(messageBody: Imessage){

        // const dfResponse = await sessionClient.detectIntent(requestBody);
        const dfResponse = await this.dialogflowResponseService.getDialogflowMessage(messageBody.messageBody, messageBody.platform, messageBody.intent, messageBody);
        const responses = dfResponse.getResponses();
        for (const key in responses){
            console.log(responses[key]);
            if (responses[key] !== null){
                const confidence = responses[key].queryResult.intentDetectionConfidence;
                const intent = responses[key].queryResult.intent.displayName;
                if (confidence > 0.75 && intent !== "Default Fallback Intent") {
                    this.intentFlag = true;
                }
            }
        }
        return dfResponse;
    }

    async makeDecision(userQuery: string) {

        // Perform the decision through LLM Prompt
        console.log("In the decision router");

        const promptTemplate = PromptTemplate.fromTemplate(
            `Given the user question and the previous conversational history below, classify based on the given array below.
            ["faq's", "asessments", "reminders", "other"]

            Here is the context of how you will classify.
            1. If the user is asking a question then classify it as faq's.
            2. If the user is requesting to register to a careplan or if the user has previously registered for a careplan, the bot will send timely messages which maybe a question that would require the user to provide an answer.
            There might be follow up questions to this question as well. So if the conversation seems to be relevant to this case classify it as assessments.
            3. If the user is asking to set a reminder or a task then classify it as reminders. We do send the reminders to the user which might require the user to give a response.
            If the conversation is in line with this, then also classify it as reminders.

            Return only one topic that matches closesly as a string.
            For example, if the user query is "What is the meaning of life?" and the classification is "faq's", then return "faq's".
            If the classification is "other" then return "other".

            User Query:
            {question}

            Conversation History:
                Human: Hello
                Bot: Welcome to our chatbot, here you can ask queries, register to careplans and set any reminders.

            <question>
            {question}
            </question>

            Classification:
            `
        );

        const model = await this.getModel();
        const chain = promptTemplate.pipe(model);

        const result = await chain.invoke({ question: userQuery });

        const output_parser = new CommaSeparatedListOutputParser();
        console.log("The result is ", result.lc_kwargs.content);
        console.log(typeof(result.lc_kwargs.content));

        const tags = output_parser.parse(result.lc_kwargs.content);

        console.log("The tags detected are ", tags);
        console.log(typeof(tags));

        // Tags would be an array of strings: ["faq's", "asessments", "reminders"]
        return tags;
    }

    async getDecision(messageBody: Imessage, channel: string){
        try {
            const workflowSetttings = await this.environmentProviderService.getClientEnvironmentVariable("WorkflowSettings");
            const workflowMode = workflowSetttings?.Value?.Mode;
            if (workflowMode === 'TRUE')
            {

                // UNCOMMENT TO ENABLE THE QA WITH WORKFLOW SERVICE
                const workflowSchema = await this.workflowEventListener.getAllSchemaForTenant();
                const workflowFlag = await this.newCheckWorkflowMode(workflowSchema, messageBody);
                this.outgoingMessage.MetaData = messageBody;

                if (workflowFlag.shouldTrigger) {
                    this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.WorkflowService;
                    this.outgoingMessage.Alert.AlertId = workflowFlag.matchedSchemaId;
                    return this.outgoingMessage;

                } else {
                    this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.QnA;
                    return this.outgoingMessage;
                }

            }

            const careplanEnrollment = await this.checkCareplanEnrollment(messageBody, channel);
            if (careplanEnrollment){
                console.log(`Checking for careplan enrollment: ${messageBody}`);
                console.log(`Enrolling to basic careplan: ${channel}`);
                console.log(`Its careplan enrollment metadata: ${JSON.stringify(careplanEnrollment)}`);
                this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.BasicCareplan;
                this.outgoingMessage.MetaData = messageBody;
                this.outgoingMessage.BasicCareplan = careplanEnrollment;
                return this.outgoingMessage;
            }
            const resultFeedback = await this.checkFeedback(messageBody, channel);
            this.outgoingMessage.MetaData = messageBody;
            if (!resultFeedback.feedbackFlag){
                const resultAssessment = await this.checkAssessment(messageBody, channel);
                if (!resultAssessment.AssessmentFlag){
                    console.log(`Checking for assessment with form submission: ${messageBody.intent}`);
                    if (messageBody.intent === MessageHandlerType.AssessmentWithFormSubmission){
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.AssessmentWithFormSubmission;
                        return this.outgoingMessage;
                    }

                    //TODO: In WhatsApp form submission response length may greater than 256, so it is going to the QnA handler.
                    if (messageBody.messageBody.length > 256) {
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.QnA;
                        return this.outgoingMessage;
                    }

                    // Check for entity collection and LLM intent classification
                    const entityCollectionCheck = await this.checkEntityCollection(messageBody);
                    if (entityCollectionCheck.requiresEntityCollection) {
                        console.log('[DecisionRouter] Entity collection required for this intent');
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.EntityCollection;
                        this.outgoingMessage.EntityCollection = {
                            sessionId     : entityCollectionCheck.sessionId,
                            intentCode    : entityCollectionCheck.intentCode,
                            isActive      : !!entityCollectionCheck.activeSession,
                            activeSession : entityCollectionCheck.activeSession
                        };
                        return this.outgoingMessage;
                    }

                    // Check if LLM classified an intent (even if it doesn't require entity collection)
                    if (entityCollectionCheck.llmClassification && entityCollectionCheck.llmClassification.intentData) {
                        console.log('[DecisionRouter] Using LLM classified intent:', entityCollectionCheck.llmClassification.intent);
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.NLP;
                        this.outgoingMessage.Intent = {
                            NLPProvider   : NlpProviderType.LLM,
                            IntentName    : entityCollectionCheck.llmClassification.intent,
                            Confidence    : entityCollectionCheck.llmClassification.confidence,
                            IntentContent : entityCollectionCheck.llmClassification
                        };
                        return this.outgoingMessage;
                    }

                    // Fall back to DialogFlow for intent detection
                    const resultIntent = await this.checkDFIntent(messageBody);
                    if (!this.intentFlag){
                        console.log("All functions returned false");
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.QnA;
                        return this.outgoingMessage;
                    } else {
                        console.log('At least one function returned true');
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.NLP;
                        this.outgoingMessage.Intent = {
                            NLPProvider   : NlpProviderType.Dialogflow,
                            IntentName    : resultIntent.getIntent(),
                            Confidence    : resultIntent.getConfidenceScore(),
                            IntentContent : resultIntent
                        };
                        return this.outgoingMessage;
                    }
                } else {
                    console.log('Skipping intent due to assessment returning true');
                    this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.Assessments;
                    this.outgoingMessage.Assessment = {
                        AssessmentId   : resultAssessment.AssessmentId,
                        AssessmentName : resultAssessment.AssessmentName,
                        TemplateId     : resultAssessment.TemplateId,
                        MetaData       : resultAssessment.MetaData,
                        Question       : resultAssessment.Question,
                        QuestionData   : resultAssessment.QuestionData
                    };
                    return this.outgoingMessage;
                }
            } else {
                console.log('Skipping assessment and intent due to feedback returning true');

                // this.outgoingMessage.Feedback.FeedbackType = resultFeedback.feedbackType;
                this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.Feedback;
                this.outgoingMessage.Feedback = {
                    FeedbackContent : resultFeedback.messageContent,
                    SupportHandler  : {
                        SupportTaskId : '',
                        Channel       : ChannelType.Clickup
                    }
                };
                return this.outgoingMessage;
            }
        } catch (error) {
            console.log('Error in router:', error);
            this.outgoingMessage.MetaData = messageBody;
            this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.QnA;
            return this.outgoingMessage;
        }
    }

    async getDialogflowLanguage(){
        const dialogflowSettings = await this.environmentProviderService.getClientEnvironmentVariable("DialogflowSettings");
        const dialogflowDefaultLanguage = dialogflowSettings?.Value?.DefaultLanguageCode;
        if (dialogflowDefaultLanguage){
            return dialogflowDefaultLanguage;
        }
        else {
            return "en-US";
        }
    }

    private async checkWorkflowMode (schema: any, messageBody: Imessage){
        try {
            const promptTemplate = PromptTemplate.fromTemplate(`
            You are a workflow routing classifier for an emergency response system. Your task is to determine if a user message should trigger ANY of the available workflows or be sent to a general LLM service for answering questions.

            DECISION CRITERIA:

            Send to WORKFLOW (flag: "true") if the user message:
            - Provides any required or optional workflow parameter data (phone numbers, location, timestamps, etc.)
            - Confirms acceptance/rejection of an emergency response
            - Updates availability status or response status
            - Provides location information, arrival confirmation, or incident updates
            - Contains actionable data that advances ANY of the workflows
            - Responds to a workflow prompt (e.g., "Are you available?", "What's your location?", "Confirm emergency")
            - Indicates intent to report an emergency or respond to one
            - Provides contact information in an emergency context

            Send to LLM SERVICE (flag: "false") if the user message:
            - Asks informational/educational questions (e.g., "How to give CPR?", "What are emergency procedures?")
            - Requests general guidance, instructions, or explanations
            - Asks about procedures, protocols, or emergency response techniques
            - Is a conversational query not providing workflow data
            - Seeks clarification about how the emergency system works
            - Contains greetings, small talk, or completely off-topic questions
            - Asks "what if" or hypothetical questions without providing actual data

            IMPORTANT DISTINCTIONS:
            - "I need help" with context → WORKFLOW (intent to report emergency)
            - "How do I help someone?" → LLM SERVICE (asking for information)
            - "Yes" / "I'm available" → WORKFLOW (responding to workflow prompt)
            - "What should I do in emergency?" → LLM SERVICE (general question)
            - Phone number or location shared → WORKFLOW (providing data)
            - "Where should I go?" → LLM SERVICE (asking for directions/info)

            OUTPUT FORMAT:
            Respond ONLY with valid JSON, no additional text or markdown:
            {{
                "flag": "true or false",
                "reason": "brief explanation of routing decision",
                "matchedSchemaId": "schema-id-if-applicable or null"
            }}

            AVAILABLE WORKFLOW SCHEMAS:
            {workflow_schema}

            USER MESSAGE: {user_message}

            Analyze the user message against ALL available workflows and determine the appropriate routing.
            `
            );
            const model = await this.getModel();
            const chain = promptTemplate.pipe(model);

            const result = await chain.invoke({
                workflow_schema : JSON.stringify(schema),
                user_message    : messageBody.messageBody
            });

            console.log("WORKFLOW MODE AI RESPONSE", result.lc_kwargs.content);

            const parsedResult = JSON.parse(result.lc_kwargs.content);
            return parsedResult.flag.toLowerCase() === "true";
        } catch (error) {
            console.log("ERROR WHILE CHECKING THE WORKFLOW MODE");
        }
    }

    private async newCheckWorkflowMode(schema: Schema | Schema[], messageBody: Imessage) {
        try {
            const result: RoutingDecision = await this.workflowRoutingService.routeMessage(
                messageBody.messageBody,
                schema
            );

            console.log("WORKFLOW MODE AI RESPONSE", result);
            return result;
        } catch (error) {
            console.log("ERROR WHILE CHECKING THE WORKFLOW MODE", error);
            const result: RoutingDecision = {
                shouldTrigger   : false,
                reason          : "Error while checking for workflow mode",
                matchedSchemaId : null
            };
            return result;
        }
    }

}
