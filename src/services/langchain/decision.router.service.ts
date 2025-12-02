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
        @inject(WorkflowEventListener) private workflowEventListener?: WorkflowEventListener
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

    public model = new ChatOpenAI({ temperature: 0, modelName: "gpt-3.5-turbo" });

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
                        code : intent
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
                        assessmentData.AssessmentFlag = false;

                        if (
                            messageBody.contextId &&
                        messageBody.intent
                        ) {
                            const matchingIntents = await intentRepository.findOne({
                                where : {
                                    code : intent
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
                MetaData       : {
                    "assessmentStart"  : false,
                    "askQuestionAgain" : false
                }
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

        // const model = new ChatOpenAI({ temperature: 0, modelName: "gpt-3.5-turbo" });

        const chain = promptTemplate.pipe(this.model);

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
            const workflowMode = this.environmentProviderService.getClientEnvironmentVariable("WORK_FLOW_MODE");
            if (workflowMode === 'TRUE')
            {
                const workflowSchema = await this.workflowEventListener.getAllSchemaForTenant();
                const workflowFlag = await this.checkWorkflowMode(workflowSchema, messageBody);
                this.outgoingMessage.MetaData = messageBody;
                if (workflowFlag) {
                    this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.WorkflowService;
                    return this.outgoingMessage;
                } else {
                    this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.QnA;
                    return this.outgoingMessage;
                }

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
                        TemplateId     : resultAssessment.TemplateId
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
        }
    }

    async getDialogflowLanguage(){
        if (this.environmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE")){
            return this.environmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE");
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
            const model = new ChatOpenAI({
                modelName : "gpt-5-mini"
            });
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

}
