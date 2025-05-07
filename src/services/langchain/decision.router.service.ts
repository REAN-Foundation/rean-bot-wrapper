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
import { NeedleService } from "../needle.service";

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
        @inject(NeedleService) private needleService?: NeedleService
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

    async checkAssessment(messageBody: Imessage, channel: string) {

        const intent = messageBody.intent;
        const key = `${messageBody.platformId}:NextQuestionFlag`;
        const nextQuestionFlag = await CacheMemory.get(key);

        const assessmentData = {
            AssessmentId   : '',
            AssessmentName : '',
            TemplateId     : '',
            CurrentNodeId  : '',
            Question       : '',
            AssessmentFlag : false,
            MetaData       : ''
        };

        // Currently will only support the assessment start through buttons
        if (
            messageBody.contextId && 
            messageBody.intent && 
            !nextQuestionFlag
        ) {
            const intentRepository = (
                (await this.entityManagerProvider.getEntityManager(this.environmentProviderService))
                    .getRepository(Intents)
            );
    
            const matchingIntents = await intentRepository.findOne({
                where : {
                    code : intent
                }
            });

            if (matchingIntents) {

                // we will call the reancare api here
                const assessmentCode = matchingIntents.dataValues[0].code;
                // const apiURL = `clinical/assessments/${assessmentCode}/start`;
                // const responseFromAssessmentService = await this.needleService.needleRequestForREAN("post", apiURL, null, {});
                // assessmentData.MetaData = responseFromAssessmentService;
                assessmentData.AssessmentId = assessmentCode;
                assessmentData.AssessmentName = matchingIntents.dataValues[0].name;
                assessmentData.AssessmentFlag = true;
            } else {

                // here we will create the false flag and return object
                assessmentData.AssessmentFlag = false;
            }
        } else {
            if (nextQuestionFlag) {
                if (nextQuestionFlag === true) {
                    assessmentData.AssessmentFlag = true;
                    await CacheMemory.set(key, false);
                }
            } else {
                assessmentData.AssessmentFlag = false;
            }
        }

        // Check if message is part of assessment
        // const chatMessageRepository = (
        //     await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        // const botMessages = await chatMessageRepository.findAll({
        //     where : {
        //         userPlatformId : messageBody.platformId,
        //         platform       : channel
        //     },
        //     order : [ [ 'createdAt', 'ASC' ] ]
        // });

        // const lastMessage = await chatMessageRepository.findOne({
        //     where : {
        //         userPlatformId : messageBody.platformId,
        //         platform       : channel
        //     },
        //     order : [ [ 'createdAt', 'DESC'] ]
        // });

        //const assessmentInProgress = botMessages[botMessages.length - 3].messageFlag

        // Implement further logic for checking if assessment.

        return assessmentData;

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
                this.outgoingMessage.MetaData = messageBody;
                this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.WorkflowService;
                return this.outgoingMessage;
            }
            const resultFeedback = await this.checkFeedback(messageBody, channel);
            this.outgoingMessage.MetaData = messageBody;
            if (!resultFeedback.feedbackFlag){
                const resultAssessment = await this.checkAssessment(messageBody, channel);
                if (!resultAssessment.AssessmentFlag){
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

}
