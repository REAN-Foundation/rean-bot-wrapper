/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { ChatMessage } from '../models/chat.message.model';
import { UserFeedback } from '../models/user.feedback.model';
import { autoInjectable } from 'tsyringe';
import { SlackClickupCommonFunctions } from './slackAndCkickupSendCustomMessage';

@autoInjectable()
export class ClickUpMessageService implements platformServiceInterface {

    constructor(private slackClickupCommonFunctions?: SlackClickupCommonFunctions){}

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
        const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: response_format.sessionId } });
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
                };
            }
        }
        else if (requestBody.event === "taskStatusUpdated") {
            const status = requestBody.history_items[0].after.status;
            console.log("status after", status);
            if (status === "complete"){
                this.eventStatusUpdated(requestBody);
            }
        }
        else {
            console.log("check the event");
        }

    }

    async eventComment(requestBody,tag) {
        const data = await UserFeedback.findOne({ where: { taskID: requestBody.task_id } });
        console.log("data", data);
        const filterText = (requestBody.history_items[0].comment.text_content).replace(tag, '');
        const textToUser = `Our Experts have responded to your query. \nYour Query: ${data.messageContent} \nExpert: ${filterText}`;
        console.log("textToUser", textToUser);
        await this.slackClickupCommonFunctions.sendCustomMessage(data.channel, data.userId, textToUser);
    }

    async eventStatusUpdated(requestBody) {
        const contactMail = "example@gmail.com";
        const data = await UserFeedback.findOne({ where: { taskID: requestBody.task_id } });
        console.log("data", data);
        const textToUser = `As our expert have provided their insight, we are closing the ticket. If you are still usatisfied with the answer provided, contact us at ${contactMail}`;
        console.log("textToUser", textToUser);
        await this.slackClickupCommonFunctions.sendCustomMessage(data.channel, data.userId, textToUser);
    }

}
