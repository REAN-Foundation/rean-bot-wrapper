import { EntityManagerProvider } from "../entity.manager.provider.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import needle from "needle";
import { WorkflowUserData } from "../../models/workflow.user.data.model";
import { IworkflowUserData } from "../../refactor/interface/workflow.user.data.interfce";
import { NeedleService } from "../needle.service";
@scoped(Lifecycle.ContainerScoped)
export class AlertListener {

    constructor (
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    ){}

    async commenceAlertListener(msg, obj){
        try {
            console.log("first parameter",msg);
            console.log("second parameter",obj);
            const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            
            const response_schema = await this.getSchemaId(clientName);
            if (msg.type === 'text'){
                msg.type = 'Text';
            }

           
            var messageContent = {
                "TenantId"  : response_schema.Data.Items[0].TenantId,
                "EventType" : "UserMessage",
                "SchemaId"  : response_schema.Data.Items[0].id,
                                                
                "UserMessage" : {
                    "Phone"          : msg.platformId,
                    "MessageType"    : msg.type,
                    "MessageChannel" : msg.platform,
                    "EventTimestamp" : '2025-01-03T12:45:12.870Z',
                    "TextMessage"    : msg.messageBody,

                },
                "EventTimestamp" : '2025-01-03T12:45:12.870Z',
            };
                       
            console.log("messageContent",messageContent);
            const url = '/engine/events/user-message';
            const response = await this.needleService.needleRequestForWorkflow("post", url, messageContent);
            console.log("response....", response);
            // eslint-disable-next-line max-len
            const workflowRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(WorkflowUserData);
            const messageStatusObj:  Partial<IworkflowUserData>  = {
                "chatSessionId"    : 1,
                "userPlatformId"   : msg.platformId,
                "channelType"      : msg.platform,
                "messageType"      : msg.type,
                "messageId"        : "123",
                "eventTimestamp"   : new Date().toISOString(),
                "schemaId"         : response_schema.Data.Items[0].id,
                "schemaInstanceId" : "123",
                "schemaName"       : "Alert",
                "nodeInstanceId"   : "123",
                "nodeId"           : "123",
                "actionId"         : "123",
                "metaData"         : messageContent,
                
            };
            console.log("messageStatusObj to send in  db",messageStatusObj);
            await workflowRepository.create(messageStatusObj);
            return response ;
        }
        catch (error){
            console.log(error);
            return error;
        }
    }

    async getSchemaId(clientName){
        try {

            const tenantId = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WORKFLOW_TENANT_ID");
        
            const url = `/engine/schema/search?tenantId=${tenantId}`;
            const response = await this.needleService.needleRequestForWorkflow("get", url);
            console.log("response from workflow", response);
            return response;
        }
        catch (error){
            console.log(error);
            return error;
        }
    }

}
