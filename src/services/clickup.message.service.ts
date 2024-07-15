/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { ChatMessage } from '../models/chat.message.model';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { SlackClickupCommonFunctions } from './slackAndCkickupSendCustomMessage';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { ContactList } from '../models/contact.list';

@scoped(Lifecycle.ContainerScoped)
export class ClickUpMessageService implements platformServiceInterface {

    constructor(
        @inject(SlackClickupCommonFunctions) private slackClickupCommonFunctions?: SlackClickupCommonFunctions,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    getMessageIdFromResponse(responseBody: any) {
        throw new Error('Method not implemented.');
    }

    public res;

    async handleMessage(requestBody: any) {
        console.log("request", requestBody);
        this.clickupEventHandler(requestBody);
        
    }

    sendManualMesage(msg: any) {
        throw new Error('Method not implemented.');
    }

    setWebhook(client: any) {
        throw new Error('Method not implemented.');
    }

    init() {
        throw new Error('Method not implemented.');
    }

    createFinalMessageFromHumanhandOver(requestBody: any) {
        throw new Error('Method not implemented.');
    }

    SendMediaMessage = async (response_format:Iresponse, payload: any) => {

        //call a function that creates csv
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: response_format.sessionId } });
        const lastMessageDate = respChatMessage[respChatMessage.length - 1].createdAt;
        const obj = { timeStamp: lastMessageDate, message: response_format.messageText };
        console.log("obj", obj);
    };

    getMessage = async (message: any) => {
        throw new Error('Method not implemented.');

    };

    postResponse = async (message: Imessage , processedResponse: IprocessedDialogflowResponseFormat) => {
        throw new Error('Method not implemented.');
    };

    async clickupEventHandler(requestBody) {
        if (requestBody.event === "taskCommentPosted" || requestBody.event === "taskCommentUpdated") {
            if (!requestBody.history_items[0].comment) {
                console.log("Not comment, hanlde later");
            }
            else {
                console.log("requestbody of comment", requestBody.history_items[0].comment);
                const commentObj = requestBody.history_items[0].comment.comment;
                for (let i = 0; i < commentObj.length; i++){
                    if (commentObj[i].type && commentObj[i].text === "@watchers"){
                        const tag = commentObj[i].text;
                        this.eventComment(requestBody,tag);
                    }
                }
            }
        }
        else if (requestBody.event === "taskStatusUpdated") {
            const status = requestBody.history_items[0].after.status;
            console.log("status after", status);
            const qAServiceFlag = this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE") ?? false;
            if (status === "complete"){
                if (qAServiceFlag ) {
                    this.eventStatusUpdated(requestBody);
                }
            }
        }
        else {
            console.log("check the event");
        }

    }

    async eventComment(requestBody,tag) {

        try {
            let platform = null;
            let userId = null;
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const contactList = entityManager.getRepository(ContactList);
        
            const personContactList = await contactList.findOne({ where: { cmrCaseTaskID: requestBody.task_id } }) ||
                                    await contactList.findOne({ where: { cmrChatTaskID: requestBody.task_id } });
            if (!personContactList) {
                const chatMessageRepository = entityManager.getRepository(ChatMessage);
                const dataValues = await chatMessageRepository.findOne({ where: { supportChannelTaskID: requestBody.task_id } });
                if (dataValues) {
                    platform = dataValues.platform;
                    userId = dataValues.userPlatformID;
                } else {
                    console.log('User not found');
                }
            } else {
                platform = personContactList.dataValues.platform;
                userId = personContactList.dataValues.mobileNumber;
            }
            const filterText = (requestBody.history_items[0].comment.text_content).replace(tag, '');
            const textToUser = `Response from Expert : ${filterText}`;
            console.log("textToUser", textToUser);

            await this.slackClickupCommonFunctions.sendCustomMessage(platform, userId, textToUser);
        } catch (error) {
            console.error('Error processing request:', error);
        } }


    async eventStatusUpdated(requestBody) {
        const contactMail = "example@gmail.com";
        const contactList =
        (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ContactList);
        let personContactList = await contactList.findOne({ where: { cmrCaseTaskID:  requestBody.task_id } });
        if (!personContactList){
            personContactList = await contactList.findOne({ where: { cmrChatTaskID:  requestBody.task_id } });
        }
        let textToUser = `As our expert have provided their insight, we are closing the ticket. If you are still unsatisfied with the answer provided, contact us at ${contactMail}`;
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_TICKET_CLOSE_RESPONSE_MESSAGE")){
            textToUser = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_TICKET_CLOSE_RESPONSE_MESSAGE");
        }
        console.log("textToUser", textToUser);
        await this.slackClickupCommonFunctions.sendCustomMessage(personContactList.dataValues.platform, personContactList.dataValues.mobileNumber, textToUser);
    }

}
