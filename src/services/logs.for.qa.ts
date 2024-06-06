import { GetLocation } from "./find.nearest.location.service";
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClickUpTask } from "./clickup/clickup.task";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from "../models/chat.message.model";
import { ContactList } from "../models/contact.list";

@scoped(Lifecycle.ContainerScoped)
export class LogsQAService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(GetLocation) private getLocation?: GetLocation,
        @inject(ClickUpTask) private clickUpTask?: ClickUpTask,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private EnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async logMesssages(response_format ){

        //eslint-disable-next-line max-len
        const userId = response_format.sessionId;
        const chatMessageRepository = await (await this.entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(ChatMessage);
        const responseChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userId , direction: 'In' } });
        let messageContentIn = "firstmessage";
        
        const contactList =
        (await this.entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(ContactList);
        const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
        let cmrTaskID = null;
        let userName = null;
        if (personContactList){
            cmrTaskID   = personContactList.dataValues.cmrChatTaskID;
            userName = personContactList.dataValues.username;
        }
        if ( responseChatMessage.length >= 1){
            messageContentIn = responseChatMessage[responseChatMessage.length - 1].messageContent;
            let taskId = await this.postingOnClickup(`Client : ` + messageContentIn,  cmrTaskID , responseChatMessage, userName);
            const messageContentOut = response_format.messageText;
            taskId = await this.postingOnClickup(`Bot : ` + messageContentOut + `\nIntent Name : ${response_format.intent}`, taskId, responseChatMessage, userName);
            await contactList.update({ cmrChatTaskID : taskId }, { where: { mobileNumber: response_format.sessionId } });
            await this.postingOnClickup(`Bot : ${messageContentOut}\nIntent Name : ${response_format.intent}`, taskId, responseChatMessage, userName);
            console.log("support channel Id is updated");
        }
    }

    async postingOnClickup(comment,cmrTaskId, responseChatMessage, userName){

        if (cmrTaskId){
            // eslint-disable-next-line max-len
            await this.clickUpTask.postCommentOnTask(cmrTaskId,comment);
            await this.clickUpTask.updateTask(cmrTaskId,null,null,userName);
            console.log("Updating old clickUp task");
            return cmrTaskId;
        }
        else
        {
            const taskID = await this.clickUpTask.createTask(responseChatMessage, userName, null, null);
            await this.clickUpTask.postCommentOnTask(taskID,comment);
            console.log("Creating new clickUp task");
            return taskID;
        }

    }

}
