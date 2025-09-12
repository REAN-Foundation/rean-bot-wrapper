import { GetLocation } from "./find.nearest.location.service";
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClickUpTask } from "./clickup/clickup.task";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from "../models/chat.message.model";
import { ContactList } from "../models/contact.list";
import { UserInfo } from "../models/user.info.model";

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
        const entityManager = await this.entityManagerProvider.getEntityManager(this.EnvironmentProviderService);
        const chatMessageRepository = await entityManager.getRepository(ChatMessage);
        const userInfoRepository = await entityManager.getRepository(UserInfo);
        const responseChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userId , direction: 'In' } });
        let messageContentIn = "firstmessage";

        const contactList =
        (await this.entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(ContactList);
        const personContactList = await contactList.findOne({ where: { mobileNumber: userId } });
        const personUserInfo = await userInfoRepository.findOne({ where: { userPlatformID: userId } });
        let cmrTaskID = null;
        let userName = null;
        let userAge = null;
        let userGender = null;
        if (personContactList){
            cmrTaskID   = personContactList.dataValues.cmrChatTaskID;
            userName = personContactList.dataValues.username;
            userAge = personUserInfo?.dataValues.userAge;
            userGender = personUserInfo?.dataValues.userGender;
        }
        const description = `**User Details**\n\n- **User Mobile Number**: ${userId}\n- **Name**: ${userName}\n- **Age**: ${userAge}\n- **Gender**: ${userGender}`;
        if ( responseChatMessage.length >= 1){
            messageContentIn = responseChatMessage[responseChatMessage.length - 1].messageContent;
            let taskId = await this.postingOnClickup(`Client : ` + messageContentIn,  cmrTaskID , responseChatMessage, userName, '', description);
            const messageContentOut = response_format.messageText;
            taskId = await this.postingOnClickup(`Bot : ` + messageContentOut + `\nIntent Name : ${response_format.intent}`, taskId, responseChatMessage, userName, response_format.intent, null, response_format.sensitivity);
            await contactList.update({
                cmrChatTaskID : taskId
            },
            {
                where : {
                    mobileNumber : response_format.sessionId
                }
            });
            console.log("support channel Id is updated");
        }
    }

    async postingOnClickup(comment,cmrTaskId, responseChatMessage, userName, intent = '', description = null, sensitivity = null){
        intent = intent?.toLocaleLowerCase();
        if (cmrTaskId){
            // eslint-disable-next-line max-len
            await this.clickUpTask.postCommentOnTask(cmrTaskId,comment);
            let sensitivity_value = null;
            if (sensitivity){
                sensitivity_value = await this.sensitivityMapper(sensitivity);
            }
            await this.clickUpTask.updateTask(cmrTaskId,sensitivity_value,description,userName, intent);
            await this.clickUpTask.updateTag(cmrTaskId, intent);
            console.log("Updating old clickUp task");
            return cmrTaskId;
        }
        else
        {
            const taskID = await this.clickUpTask.createTask(responseChatMessage, userName, description, null, intent);
            await this.clickUpTask.postCommentOnTask(taskID,comment);
            console.log("Creating new clickUp task");
            return taskID;
        }

    }
    async sensitivityMapper(sensitivity_flag: string) {
        const sensitivityPriorityMap: Record<string, number> = {
            "Critical / Urgent" : 1,
            "High Sensitivity"  : 2,
            "Sensitive but Safe": 3,
            "Not sensitive"     : 4
        };

        const normalizedFlag = sensitivity_flag?.trim();

        return sensitivityPriorityMap[normalizedFlag] ?? null;
    }

}
