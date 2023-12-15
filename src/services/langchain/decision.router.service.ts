/* eslint-disable @typescript-eslint/no-var-requires */
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { CommaSeparatedListOutputParser } from "langchain/schema/output_parser";
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Imessage, OutgoingMessage } from "../../refactor/interface/message.interface";
import { FeedbackService } from "../feedback/feedback.service";
import { ChatMessage } from "../../models/chat.message.model";
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
const dialogflow = require('@google-cloud/dialogflow');
import { v4 } from "uuid";
import { MessageHandlerType, NlpProviderType, UserFeedbackType, ChannelType } from "../../refactor/messageTypes/message.types";
import { EmojiFilter } from "../filter.message.for.emoji.service";

@scoped(Lifecycle.ContainerScoped)
export class DecisionRouter {

    outgoingMessage!: OutgoingMessage;

    constructor(
        @inject(FeedbackService) private feedbackService?: FeedbackService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EmojiFilter) private emojiFilter?: EmojiFilter
    ){
        this.outgoingMessage = {
            PrimaryMessageHandler : MessageHandlerType.Unhandled,
            Intent                : {
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

            }
            
        };
    }


    public model = new ChatOpenAI({ temperature: 0, modelName: "gpt-3.5-turbo" });

    public feedbackFlag = false;
    
    public assessmentFlag = false;

    public intentFlag = false;

    async checkFeedback(messageBody: Imessage, channel: string){

        // Check if message is feedback or not
        let feedbackType = '';
        let feedback = '';
        if (messageBody.contextId){
            const tag = "Feedback";
            this.feedbackService.recordFeedback(messageBody.messageBody,messageBody.contextId,tag);
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

    async checkAssessment(messageBody: Imessage, channel: string){

        // Check if message is part of assessment
        const chatSessionRepository = (
            await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const lastBotMessage = await chatSessionRepository.findOne({
            where : { 
                userPlatformId : messageBody.platformId,
                platform       : channel
            },
            order : [ [ 'createdAt', 'DESC' ] ]
        });
        const lastMessage = await chatSessionRepository.findOne({
            where : {
                userPlatformId : messageBody.platformId,
                platform       : channel
            },
            order : [ [ 'createdAt', 'DESC'] ]
        });

        const assessmentInProgress = lastBotMessage.messageFlag;
        this.assessmentFlag = ( assessmentInProgress === 'assessment' ) ? true : false;

        if (this.assessmentFlag) {
            
            // implement the logic here for checking if last question was assessment.
        } else {

            // Implement LLM router handler here
        }

        return this.assessmentFlag;

    }

    async checkDFIntent(messageBody: Imessage){

        // Get matching intents with score for dialogflow
        const userId = messageBody.platformId === null ? v4() : messageBody.platformId;
        let options = {};
        const dfGCPCredentials = JSON.parse(this.clientEnvironmentProviderService.getClientEnvironmentVariable('DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS'));
        const GCPCredenctials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const dfAppCredentialsObj = dfGCPCredentials ? dfGCPCredentials : GCPCredenctials;

        options = {
            credentials : {
                client_email : dfAppCredentialsObj.client_email,
                private_key  : dfAppCredentialsObj.private_key,
            },
            projectId : dfAppCredentialsObj.project_id
        };
        const projectIdFinal = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_PROJECT_ID");

        const sessionClient = new dialogflow.SessionsClient(options);
        const sessionPath = sessionClient.projectAgentSessionPath(projectIdFinal, userId);
        const dialogflowLanguage = await this.getDialogflowLanguage();
        const requestBody = {
            session    : sessionPath,
            queryInput : {
                text : {
                    text         : messageBody.messageBody,
                    languageCode : dialogflowLanguage
                }
            }
        };

        const dfResponse = await sessionClient.detectIntent(requestBody);

        for (const key in dfResponse){
            console.log(dfResponse[key]);
            if (dfResponse[key]!== null){
                const confidence = dfResponse[key].queryResult.intentDetectionConfidence;
                if (confidence > 0.85) {
                    this.intentFlag = true;
                }
            }
        }
        return dfResponse[0];
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
            const resultFeedback = await this.checkFeedback(messageBody, channel);
            if (!resultFeedback.feedbackFlag){
                const resultAssessment = await this.checkAssessment(messageBody, channel);
                if (!resultAssessment){
                    const resultIntent = await this.checkDFIntent(messageBody);
                    if (!resultIntent){
                        console.log("All functions returned false");
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.NLP;
                        this.outgoingMessage.Intent = {
                            NLPProvider : NlpProviderType.Dialogflow,
                            IntentName  : resultIntent.queryResult.intent.displayName,
                            Confidence  : resultIntent.queryResult.intentDetectionConfidence
                        };
                        return this.outgoingMessage;
                    } else {
                        console.log('At least one function returned true');
                        this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.QnA;
                        return this.outgoingMessage;
                    }
                } else {
                    console.log('Skipping intent due to assessment returning true');
                    this.outgoingMessage.PrimaryMessageHandler = MessageHandlerType.Assessments;
                    this.outgoingMessage.Assessment = {
                        AssessmentId   : '123',
                        AssessmentName : 'Test',
                        TemplateId     : '111'
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
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE")){
            return this.clientEnvironmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE");
        }
        else {
            return "en-US";
        }

    }
}
