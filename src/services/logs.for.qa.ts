import { GetLocation } from "./find.nearest.location.service";
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClickUpTask } from "./clickup/clickup.task";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import path from 'path';
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from "../models/chat.message.model";

@scoped(Lifecycle.ContainerScoped)
export class LogsQAService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(GetLocation) private getLocation?: GetLocation,
        @inject(ClickUpTask) private clickUpTask?: ClickUpTask,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,

        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async logMesssages(response_format ){

        //eslint-disable-next-line max-len
        const chatMessageRepository = await (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);

        const responseChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: response_format.sessionId, direction: 'In' } });
        let supportChannelTaskID = null;
        let messageContentIn = "firstmessage";
        let userName = null;
        if ( responseChatMessage.length >= 1){
            messageContentIn = responseChatMessage[responseChatMessage.length - 1].messageContent;
            if ( responseChatMessage.length > 1){
                supportChannelTaskID = responseChatMessage[responseChatMessage.length - 2].supportChannelTaskID;
            }
            if (responseChatMessage[responseChatMessage.length - 1].name){
                userName = responseChatMessage[responseChatMessage.length - 1].name;
            } else {
                userName = response_format.sessionId;
            }
            let taskId = await this.postingOnClickup(`Client : ` + messageContentIn, supportChannelTaskID, responseChatMessage, userName);
            const messageContentOut = response_format.messageText;
            taskId = await this.postingOnClickup(`Bot : ` + messageContentOut + `\nIntent Name : ${response_format.intent}`, taskId, responseChatMessage, userName);
            await chatMessageRepository.update({ supportChannelTaskID: taskId, humanHandoff: "false" }, { where: { id: responseChatMessage[responseChatMessage.length - 1].id } });
            await this.postingOnClickup(`Bot : ${messageContentOut}\nIntent Name : ${response_format.intent}`, taskId, responseChatMessage, userName)
                .then(taskId => {
                    return chatMessageRepository.update(
                        { supportChannelTaskID: taskId, humanHandoff: "false" },
                        { where: { id: responseChatMessage[responseChatMessage.length - 1].id } }  );
                });
            console.log("support channel Id is updated");
        }
    }

    async postingOnClickup(comment, supportChannelTaskID, responseChatMessage, userName){

        if (supportChannelTaskID){
            // eslint-disable-next-line max-len

            // await this.clickUpTask.updateTask(taskID,priority,user_details);
            // await this.clickUpTask.taskAttachment(taskID,attachmentPath);
            await this.clickUpTask.postCommentOnTask(supportChannelTaskID,comment);
            await this.clickUpTask.updateTask(supportChannelTaskID,null,null,null);
            console.log("Updating old clickUp task");
            return supportChannelTaskID;
        }
        else
        {
            // const userName = responseChatMessage[responseChatMessage.length - 1].name;
            const taskID = await this.clickUpTask.createTask(responseChatMessage, userName, null, null);
            await this.clickUpTask.postCommentOnTask(taskID,comment);

            // await this.clickUpTask.taskAttachment(taskID, attachmentPath);
            //await this.clickUpTask.postCommentOnTask(taskID, comment);
            console.log("Creating new clickUp task");
            return taskID;
        }

    }

}
