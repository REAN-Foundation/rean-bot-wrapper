/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { ChatMessage } from '../models/chat.message.model';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { SlackClickupCommonFunctions } from './slackAndCkickupSendCustomMessage';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class ClickUpMessageService implements platformServiceInterface {

    constructor(
        @inject(SlackClickupCommonFunctions) private slackClickupCommonFunctions?: SlackClickupCommonFunctions,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

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
                if (qAServiceFlag === false) {
                    this.eventStatusUpdated(requestBody);
                }
            }
        }
        else {
            console.log("check the event");
        }

    }

    async eventComment(requestBody,tag) {
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const data = await chatMessageRepository.findOne({ where: { supportChannelTaskID: requestBody.task_id } });
        console.log("data", data);
        const filterText = (requestBody.history_items[0].comment.text_content).replace(tag, '');
        let textToUser = null;
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE")) {
            textToUser = `Our experts have responded to your query. \nExpert: ${filterText}`;
        } else {
            textToUser = `Our experts have responded to your query. \nYour Query: ${data.messageContent} \nExpert: ${filterText}`;
        }
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_RESPONSE_MESSAGE")){
            const message_from_secret = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_RESPONSE_MESSAGE");
            textToUser = message_from_secret + `\n ${filterText}`;
        }
        console.log("textToUser", textToUser);
        await this.slackClickupCommonFunctions.sendCustomMessage(data.platform, data.userPlatformID, textToUser);
    }

    async eventStatusUpdated(requestBody) {
        const contactMail = "example@gmail.com";
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const data = await chatMessageRepository.findOne({ where: { supportChannelTaskID: requestBody.task_id } });
        console.log("data", data);
        let textToUser = `As our expert have provided their insight, we are closing the ticket. If you are still unsatisfied with the answer provided, contact us at ${contactMail}`;
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_TICKET_CLOSE_RESPONSE_MESSAGE")){
            textToUser = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_TICKET_CLOSE_RESPONSE_MESSAGE");
        }
        console.log("textToUser", textToUser);
        await this.slackClickupCommonFunctions.sendCustomMessage(data.platform, data.userPlatformID, textToUser);
    }

}
