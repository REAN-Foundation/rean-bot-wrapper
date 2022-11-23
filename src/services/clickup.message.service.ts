/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import http from 'https';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fs from 'fs';
import { AwsS3manager } from './aws.file.upload.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable, singleton, inject, delay } from 'tsyringe';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Iresponse, Imessage, IprocessedDialogflowResponseFormat } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service';
import { MockCHannelMessageFunctionalities } from './mock.channel.message.funtionalities';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { getRequestOptions } from '../utils/helper';
import { ChatMessage } from '../models/chat.message.model';
import request from 'request';
import util from 'util';
import { WhatsappMessageService } from './whatsapp.message.service';
import { WhatsappMetaMessageService } from './whatsapp.meta.message.service';
import { ResponseHandler } from '../utils/response.handler';
import { TelegramMessageService } from './telegram.message.service';
import { UserFeedback } from '../models/user.feedback.model';
import FormData from 'form-data';
import axios from 'axios';

@autoInjectable()
@singleton()
export class ClickUpMessageService implements platformServiceInterface {

    public res;

    constructor(@inject(delay(() => WhatsappMessageService)) public whatsappMessageService,
        @inject(delay(() => WhatsappMetaMessageService)) public whatsappNewMessageService,
        private telegramMessageservice?: TelegramMessageService,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {}

    async handleMessage(requestBody: any) {
        console.log("request", requestBody);
        
        // console.log("user", util.inspect(requestBody.history_items[0].user));
        // console.log("comment", util.inspect(requestBody.history_items[0].comment));
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

    SendMediaMessage = async (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) => {
        
        //call a function that creates csv
        const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: contact } });
        const lastMessageDate = respChatMessage[respChatMessage.length - 1].createdAt;
        const obj = { timeStamp: lastMessageDate, message: message };
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
                    if (commentObj[i].type){
                        const tag = commentObj[i].text;
                        this.eventComment(requestBody,tag);
                    }
                }
                
                // console.log("requestbody of comment attributes", requestBody.history_items[0].comment.comment[1].attributes);
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
        await this.sendCustomMessage(data.channel, data.userId, textToUser);
    }

    async eventStatusUpdated(requestBody) {
        const contactMail = "example@gmail.com";
        const data = await UserFeedback.findOne({ where: { taskID: requestBody.task_id } });
        console.log("data", data);
        const textToUser = `As our expert have provided their insight, we are closing the ticket. If you are still usatisfied with the answer provided, contact us at ${contactMail}`;
        console.log("textToUser", textToUser);
        await this.sendCustomMessage(data.channel, data.userId, textToUser);
    }

    async sendCustomMessage(channel, contact, message) {
        if (channel === "telegram"){
            await this.telegramMessageservice.SendMediaMessage(contact, null, message, "text");
        }
        else if (channel === "whatsapp"){
            await this.whatsappMessageService.SendMediaMessage(contact.toString(), null, message, "text");
        }
        else if (channel === "whatsappNew"){
            await this.whatsappNewMessageService.SendMediaMessage(contact.toString(), null, message, "text");
        }
    }

}
