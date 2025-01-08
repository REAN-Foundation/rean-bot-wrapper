/* eslint-disable @typescript-eslint/no-unused-vars */
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import WorkflowUserData from "../../models/workflow.user.data.model";
import { NeedleService } from "../needle.service";
import { Imessage } from "../../refactor/interface/message.interface";
import { UserMessageType, WorkflowEvent } from "./workflow.event.types";

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
            const timestamp = new Date().toISOString();
            var messageContent: WorkflowEvent = {
                TenantId         : tenantId,
                EventType        : "UserMessage",
                SchemaId         : schemaId,
                SchemaInstanceId : schemaInstanceId,
                UserMessage      : {
                    Phone          : message.platformId,
                    EventTimestamp : timestamp,
                    MessageType    : message.type,
                    MessageChannel : message.platform,
                    Placeholders   : prevMessage?.Placeholders,
                    Payload        : prevMessage?.Payload,
                }
            };

            const isQuestion = prevMessage?.MessageType === UserMessageType.Question;

            if (incomingMessageType === 'Text') {
                if (isQuestion) {
                    messageContent.UserMessage['Question']  = prevMessage.Question;
                    messageContent.UserMessage['QuestionOptions'] = prevMessage.QuestionOptions;
                    messageContent.UserMessage['QuestionResponse'] = prevMessage.QuestionResponse;

                    //Below set the user's response to question
                    //Please check the correct type
                    messageContent.UserMessage['QuestionResponse']['ResponseContent'] = message.messageBody;
                }
                else {
                    messageContent.UserMessage['TextMessage'] = message.messageBody;
                }
            }
            if (incomingMessageType === 'Location'){
                messageContent.UserMessage['Location'] = {
                    'Latitude'  : message.latlong?.latitude ?? null,
                    'Longitude' : message.latlong?.longitude ?? null,
                };
            }

            console.log("messageContent",messageContent);
            const url = '/engine/events/user-message';
            const response = await this.needleService.sendWorkflowEvent(url, messageContent);
            if (response) {
                console.log("Workflow event acknowledged", response);
            }
            else {
                console.log("No response from workflow");
                return null;
            }

            const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
            const workflowRepository = entManager.getRepository(WorkflowUserData);
            const workflowEvent  = {
                TenantId          : tenantId,
                EventType         : 'UserMessage',
                SchemaId          : schemaId,
                SchemaInstanceId  : schemaInstanceId,
                ChatSessionId     : 1,
                UserPlatformId    : message.platformId,
                PhoneNumber       : message.platformId,
                ChannelType       : message.platform,
                MessageType       : incomingMessageType,
                IsMessageFromUser : true,
                MessageId         : message.chat_message_id,
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

    async getAllSchemaForTenant(){
        try {
            const tenantId = this.environmentProviderService.getClientEnvironmentVariable("WORKFLOW_TENANT_ID");
            const url = `/engine/schema/search?tenantId=${tenantId}`;
            const responseBody = await this.needleService.sendWorkflowEvent("get", url);
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
    }

}
