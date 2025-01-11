/* eslint-disable @typescript-eslint/no-unused-vars */
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import WorkflowUserData from "../../models/workflow.user.data.model";
import { NeedleService } from "../needle.service";
import { Imessage } from "../../refactor/interface/message.interface";
import { UserMessageType, WorkflowEvent } from "./workflow.event.types";
import { ChatSession } from "../../models/chat.session";
import { ChatMessage } from "../../models/chat.message.model";
import { WorkflowCache } from "./workflow.cache";
import needle from "needle";
import axios from "axios";
import http from 'http';

//////////////////////////////////////////////////////////////////////////////

@scoped(Lifecycle.ContainerScoped)
export class WorkflowEventListener {

    constructor (
        @inject(EntityManagerProvider) private _entityProvider?: EntityManagerProvider,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(ClientEnvironmentProviderService) private environmentProviderService?: ClientEnvironmentProviderService,
    ){}

    public getPreviousMessageFromWorkflow = async (platformUserId: string): Promise<WorkflowUserData> => {
        const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
        const workflowRepository = entManager.getRepository(WorkflowUserData);
        const previousMessage = await workflowRepository.findOne({
            where : {
                UserPlatformId    : platformUserId,
                IsMessageFromUser : false
            },
            order : [
                ['CreatedAt', 'DESC']
            ]
        });
        return previousMessage;
    }

    async commence(message: Imessage) {
        try {
            console.log("Message ->", message);

            const schemaList = await this.getAllSchemaForTenant();
            if (!schemaList || schemaList.length === 0) {
                return null;
            }

            var schemaId = schemaList[0].id;
            var schemaInstanceId: string = null;
            var schemaName: string = null;
            var nodeInstanceId: string = null;
            var nodeId: string = null;
            var actionId: string = null;
            const tenantId = this.environmentProviderService.getClientEnvironmentVariable("WORKFLOW_TENANT_ID");

            const prevMessage: WorkflowUserData = await this.getPreviousMessageFromWorkflow(message.platformId);
            if (!prevMessage) {
                var baseSchema = schemaList.find((schema) => schema.ParentSchemaId === null);
                if (baseSchema) {
                    schemaId = baseSchema.id;
                }
            }
            else {
                schemaId         = prevMessage.SchemaId;
                schemaInstanceId = prevMessage.SchemaInstanceId;
                schemaName       = prevMessage.SchemaName;
                nodeInstanceId   = prevMessage.NodeInstanceId;
                nodeId           = prevMessage.NodeId;
                actionId         = prevMessage.NodeActionId;
            }

            var incomingMessageType = message.type;
            if (incomingMessageType === 'text') {
                incomingMessageType = 'Text';
            }
            if (incomingMessageType === 'location' || incomingMessageType === 'Location' ){
                incomingMessageType = 'Location';
            }

            var platform = message.platform;
            if (platform === 'whatsapp') {
                platform = 'WhatsApp';
            }
            if (platform === 'telegram') {
                platform = 'Telegram';
            }

            const timestamp = new Date().toISOString();

            var messageContent = {
                "TenantId"       : tenantId,
                "EventType"      : "UserMessage",
                "SchemaId"       : schemaId,
                "EventTimestamp" : timestamp,
                "UserMessage"    : {
                    "Phone"          : message.platformId,
                    "EventTimestamp" : timestamp,
                    "MessageType"    : incomingMessageType,
                    "MessageChannel" : message.platform,
                }
            };

            if (schemaInstanceId) {
                messageContent["SchemaInstanceId"] = schemaInstanceId;
            }

            if (prevMessage?.Placeholders) {
                messageContent["UserMessage"]['Placeholders'] = prevMessage?.Placeholders;
            }
            if (prevMessage?.Payload) {
                messageContent["UserMessage"]['Payload'] = prevMessage?.Payload;
            }

            const isQuestion = prevMessage?.MessageType === UserMessageType.Question;

            if (incomingMessageType === 'Text') {
                if (isQuestion) {
                    messageContent["UserMessage"]['Question']  = prevMessage.Question;
                    messageContent["UserMessage"]['QuestionOptions'] = prevMessage.QuestionOptions;
                    messageContent["UserMessage"]['QuestionResponse'] = prevMessage.QuestionResponse;

                    //Below set the user's response to question
                    //Please check the correct type
                    messageContent["UserMessage"]['QuestionResponse']['ResponseContent'] = message.messageBody;
                }
                else {
                    messageContent["UserMessage"]['TextMessage'] = message.messageBody;
                }
            }
            if (incomingMessageType === 'Location'){
                messageContent["UserMessage"]['Location'] = {
                    'Latitude'  : message.latlong?.latitude ?? null,
                    'Longitude' : message.latlong?.longitude ?? null,
                };
            }

            console.log("messageContent",messageContent);
            const url = '/engine/events/user-message';

            //http://localhost:2345/api/v1/engine/events/user-message
            //http://localhost:2345/api/v1/engine/events/user-message
            const response = await this.callWorkflowApi('post', url, messageContent);
            if (response) {
                console.log("Workflow event acknowledged", response);
            }
            else {
                console.log("No response from workflow");
                return null;
            }

            const chatSessionId = await this.getChatSessionId(message.platformId);
            const botMessageId = await this.getLastBotMessageId(message.platformId, 'In');

            const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
            const workflowRepository = entManager.getRepository(WorkflowUserData);
            const workflowEvent  = {
                TenantId          : tenantId,
                EventType         : 'UserMessage',
                SchemaId          : schemaId,
                SchemaInstanceId  : schemaInstanceId,
                ChatSessionId     : chatSessionId,
                UserPlatformId    : message.platformId,
                PhoneNumber       : message.platformId,
                ChannelType       : message.platform,
                MessageType       : incomingMessageType,
                IsMessageFromUser : true,
                ChannelMessageId  : message.chat_message_id, //This is channel message id
                BotMessageId      : botMessageId,
                EventTimestamp    : new Date(),
                SchemaName        : schemaName,
                NodeInstanceId    : nodeInstanceId,
                NodeId            : nodeId,
                NodeActionId      : actionId,
                TextMessage       : incomingMessageType === 'Text' ? message.messageBody : null,
                Location          : incomingMessageType === 'Location' ? {
                    Latitude  : message.latlong?.latitude ?? null,
                    Longitude : message.latlong?.longitude ?? null,
                } : null,
                ImageUrl         : null,
                AudioUrl         : null,
                VideoUrl         : null,
                FileUrl          : null,
                Question         : isQuestion ? prevMessage.Question : null,
                QuestionOptions  : isQuestion ? prevMessage.QuestionOptions : null,
                QuestionResponse : isQuestion ? message.messageBody : null,
                Placeholders     : prevMessage?.Placeholders ?? null,
                Payload          : prevMessage?.Payload ?? null,
            };
            console.log("Storing the workflow event to database", workflowEvent);
            await workflowRepository.create(workflowEvent);
            return response ;
        }
        catch (error){
            console.log(error);
            return error;
        }
    }

    getChatSessionId = async (platformUserId: string) => {
        const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
        const chatSessionRepository = entManager.getRepository(ChatSession);
        const chatSession = await chatSessionRepository.findOne({
            where : {
                userPlatformID : platformUserId
            }
        });
        if (!chatSession) {
            return null;
        }
        return chatSession.autoIncrementalID;
    };

    getLastBotMessageId = async (platformUserId: string, direction: string) => {
        const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
        const botMessageRepository = entManager.getRepository(ChatMessage);
        const botMessage = await botMessageRepository.findOne({
            where : {
                userPlatformID : platformUserId,
                direction      : direction
            },
            order : [
                ['createdAt', 'DESC']
            ]
        });
        if (!botMessage) {
            return null;
        }
        return botMessage.id;
    };

    getAllSchemaForTenant = async () => {
        try {
            const tenantId = this.environmentProviderService.getClientEnvironmentVariable("WORKFLOW_TENANT_ID");
            const url = `/engine/schema/search?tenantId=${tenantId}`;
            const responseBody = await this.callWorkflowApi('get', url);
            if (!responseBody) {
                return null;
            }
            console.log("response from workflow", responseBody);
            return responseBody.Data.Items;
        }
        catch (error){
            console.log(error);
            return error;
        }
    };

    getWorkflowApiAccessToken = async () => {
        try {

            const tenantId = this.environmentProviderService.getClientEnvironmentVariable("WORKFLOW_TENANT_ID");
            const token = WorkflowCache.get(`${tenantId}-WorkflowApiAccessToken`);
            if (token && token.ExpiresIn > new Date()) {
                return token.AccessToken;
            }

            const WorkflowBaseUrl = this.environmentProviderService.getClientEnvironmentVariable("WORKFLOW_URL");
            const loginUrl = `${WorkflowBaseUrl}/users/login-password`;
            const WorkflowAPIkey = this.environmentProviderService.getClientEnvironmentVariable("WORK_FLOW_API_KEY");
            const Username = this.environmentProviderService.getClientEnvironmentVariable("WORK_FLOW_USERNAME");
            const Password = this.environmentProviderService.getClientEnvironmentVariable("WORK_FLOW_PASSWORD");

            const messageContent = {
                UserName : Username,
                Password : Password
            };
            const option = {
                headers : {
                    'Content-Type' : 'application/json',
                    'X-Api-Key'    : WorkflowAPIkey
                }
            };
            const respToken = await needle("post", loginUrl, messageContent, option);
            if (!respToken) {
                return null;
            }
            const accessToken = respToken.body.Data.AccessToken;
            if (accessToken) {
                const expiresIn = respToken.body.Data.ExpiresIn;
                const expiryDate = new Date(expiresIn);
                WorkflowCache.set(`${tenantId}-WorkflowApiAccessToken`, {
                    ExpiresIn   : expiryDate,
                    AccessToken : accessToken
                });
            }
            return accessToken;
        }
        catch (error){
            console.log(error);
            return null;
        }
    };

    callWorkflowApi = async (method:string, url:string, obj?: any): Promise<any> => {
        try {
            const WorkflowBaseUrl = this.environmentProviderService.getClientEnvironmentVariable("WORKFLOW_URL");
            const WorkflowAPIkey = this.environmentProviderService.getClientEnvironmentVariable("WORK_FLOW_API_KEY");
            const accessToken = await this.getWorkflowApiAccessToken();
            if (!accessToken) {
                console.log("Failed to get access token from workflow API.");
                return null;
            }
            const agent = new http.Agent({ keepAlive: true });
            const options = {
                httpAgent : agent,
                headers   : {
                    "Content-Type"  : 'application/json',
                    "Authorization" : `Bearer ${accessToken}`,
                    "x-api-key"     : WorkflowAPIkey
                }
            };

            const apiUrl = WorkflowBaseUrl + url;
            let response = null;
            if (method === "get") {
                response = await axios.get(apiUrl, options);
            }
            else if (method === "post") {

                console.log('The body of the request is ' + JSON.stringify(obj, null, 2));
                console.log('The url of the request is ' + apiUrl);
                console.log('The options of the request is ' + JSON.stringify(options, null, 2));
                console.log('The method of the request is ' + method);

                response = await axios.post(apiUrl, obj, {
                    headers : {
                        'Content-Type'  : 'application/json',
                        'X-Api-Key'     : WorkflowAPIkey,
                        'Authorization' : `Bearer ${accessToken}`
                    }
                });
            }

            if (response.status !== 200 && response.status !== 201) {
                console.log("Failed to get response from workflow API.");
                return null;
            }
            console.log("Response from workflow API", response.body);

            return response.data;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

}
