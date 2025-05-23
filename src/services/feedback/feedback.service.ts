/* eslint-disable max-len */
import { feedbackInterface } from './feedback.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { SlackMessageService } from '../slack.message.service';
import { ChatMessage } from '../../models/chat.message.model';
import { HumanHandoff } from '../../services/human.handoff.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { CalorieInfo } from '../../models/calorie.info.model';
import { Op } from 'sequelize';
import { ClickUpTask } from '../clickup/clickup.task';
import { EntityManagerProvider } from '../entity.manager.provider.service';

@scoped(Lifecycle.ContainerScoped)
export  class FeedbackService implements feedbackInterface {

    constructor(
        @inject(SlackMessageService) private slackMessageService?: SlackMessageService,
        @inject(ClickUpTask) private clickuptask?: ClickUpTask,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async recordFeedback(message,contextID,tag)
    {
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const responseChatMessage = await chatMessageRepository.findAll({ where: { responseMessageID: contextID } });
        await this.supportChannel("ClickUp", responseChatMessage, message,null, tag);
        console.log("we are getting into recording feedback");
    }

    async NegativeFeedback(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                const humanHandoff: HumanHandoff = eventObj.container.resolve(HumanHandoff);
                const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
                const messageContent = eventObj.body.originalDetectIntentRequest.payload.completeMessage.messageBody;
                const payload = eventObj.body.originalDetectIntentRequest.payload;
                const userId = payload.userId;
                const username = payload.userName;
                const client_name = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(ChatMessage);
                let responseChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userId } });
                await chatMessageRepository.update({ humanHandoff: "false", feedbackType: "Negative Feedback" }, { where: { id: responseChatMessage[responseChatMessage.length - 1].id } });
                if (client_name === "CALORIE_BOT") {
                    console.log("Calorie negative feedback received.");
                    const response = await chatMessageRepository.findAll({ limit: 2, where: { userPlatformId: userId, direction: "In" }, raw: true, order: [['createdAt', 'DESC']] });
                    const negativeResponse = response[response.length - 1].messageContent;
                    const CalorieInfoRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(CalorieInfo);
                    await CalorieInfoRepository.findOne(
                        {
                            where : { user_message: { [Op.like]: `${negativeResponse}` } },
                            order : [['updatedAt', 'DESC']],
                            limit : 1,
                        }).then(function (record) {
                        return record.update({ negative_feedback: 1 });
                    });
                    const data = {
                        "fulfillmentMessages" : [
                            {
                                "text" : {
                                    "text" : [
                                        "Thank you for your feedback. Would you like to update the calorie value for the above food item?"
                                    ]
                                }
                            }
                        ]
                    };
                    resolve(data);
                }
                else {
                    // eslint-disable-next-line init-declarations
                    const description = `**User Details**\n\n- **User Platform ID**: ${userId}\n- **Username**: ${username}`;
                    const preferredSupportChannel = clientEnvironmentProviderService.getClientEnvironmentVariable("SUPPORT_CHANNEL");
                    if (payload.contextId){
                        responseChatMessage = await chatMessageRepository.findAll({ where: { responseMessageID: payload.contextId } });
                        await this.supportChannel(preferredSupportChannel,responseChatMessage,messageContent,null,"Negative Feedback",description);
                    }
                    else {
                        const topic = responseChatMessage[responseChatMessage.length - 2].messageContent;
                        await this.supportChannel(preferredSupportChannel,responseChatMessage,messageContent,topic,"Negative Feedback",description);
                    }
                    if (await humanHandoff.checkTime() === "false"){
                        let reply = "";
                        if (clientEnvironmentProviderService.getClientEnvironmentVariable("NEGATIVE_FEEDBACK_MESSAGE")) {
                            reply = clientEnvironmentProviderService.getClientEnvironmentVariable("NEGATIVE_FEEDBACK_MESSAGE");
                        } else {
                            reply = "We're genuinely sorry to hear that you weren't satisfied with the assistance provided by our chatbot. Your feedback is invaluable in helping us improve our services. our team of experts will provide you with a satisfactory resolution as quickly as possible.";
                        }
                        const data = {
                            "fulfillmentMessages" : [
                                {
                                    "text" : {
                                        "text" : [
                                            reply
                                        ]
                                    }
                                }
                            ]
                        };
                        resolve(data);
                    }
                    else if (await humanHandoff.checkTime() === "true"){
                        const reply = "A message regarding your query has been sent to our experts. Would you like to connect with our expert?";
                        const data = {
                            "fulfillmentMessages" : [
                                {
                                    "text" : { "text": [reply] }
                                },
                                {
                                    "payload" : {
                                        "messagetype" : "interactive-buttons",
                                        "buttons"     : [
                                            {
                                                "reply" : {
                                                    "title" : "Yes",
                                                    "id"    : "human-handoff-yes"
                                                },
                                                "type" : "reply"
                                            },
                                            {
                                                "type"  : "reply",
                                                "reply" : {
                                                    "title" : "No",
                                                    "id"    : "human-handoff-no"
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        };
                        resolve(data);
                    }
                }
                
            }
                
            catch (error) {
                console.log(error, 500, "Negative Feedback Service Error!");
                reject(error.message);
            }
        });

    }

    async PositiveFeedback(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                const payload = eventObj.body.originalDetectIntentRequest.payload;
                const userId = payload.userId;
                const username = payload.userName;
                const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
                const messageContent = eventObj.body.originalDetectIntentRequest.payload.completeMessage.messageBody;
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(ChatMessage);
                const listOfUserRequestdata = await chatMessageRepository.findAll({ where: { userPlatformID: userId } });
                await chatMessageRepository.update({ feedbackType: "Positive Feedback" },{ where: { id: listOfUserRequestdata[listOfUserRequestdata.length - 1].id } });
                const replyToSend = this.clientEnvironmentProviderService.getClientEnvironmentVariable("POSITIVE_FEEDBACK_MESSAGE");
                let reply;
                if (replyToSend) {
                    reply = replyToSend;
                } else {
                    reply = "We are glad that you like it. Thank you for your valuable feedback";
                }
                let responseChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: userId } });
                const preferredSupportChannel = clientEnvironmentProviderService.getClientEnvironmentVariable("SUPPORT_CHANNEL");
                const description = `**User Details**\n\n- **User Platform ID**: ${userId}\n- **Username**: ${username}`;
                if (payload.contextId){
                    responseChatMessage = await chatMessageRepository.findAll({ where: { responseMessageID: payload.contextId } });
                    await this.supportChannel(preferredSupportChannel,responseChatMessage,messageContent,null,"Positive Feedback",description);
                }
                else {
                    const topic = responseChatMessage[responseChatMessage.length - 2].messageContent;
                    await this.supportChannel(preferredSupportChannel,responseChatMessage,messageContent,topic,"Positive Feedback",description);
                }
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    reply
                                ]
                            }
                        }
                    ]
                };
                resolve(data);
            }
            catch (error) {
                console.log(error, 500, "Negative Feedback Service Error!");
                reject(error.message);
            }
        });

    }

    supportChannel = async(preferredSupportChannel, responseChatMessage, messageContent, topic = null,tag = null,description= null) => {
        if (preferredSupportChannel === "ClickUp"){
            const listID = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_ISSUES_LIST_ID");
            const chatMessageRepository = await (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);

            const clickUpResponseTaskID:any = await this.clickuptask.createTask(responseChatMessage,topic,description,null, listID,tag);
            console.log(`new ticket has been created with task id ${clickUpResponseTaskID}`);
            if (responseChatMessage[responseChatMessage.length - 1]){
                const userPlatformId = responseChatMessage[responseChatMessage.length - 1].dataValues.id;
                await chatMessageRepository.update({ supportChannelTaskID: clickUpResponseTaskID }, { where: { id: userPlatformId } })
                    .then(() => { console.log(" task ID updated for feedback"); })
                    .catch(error => console.log("error on updating Task ID", error));
            }
            const comment = messageContent;
            await this.clickuptask.postCommentOnTask(clickUpResponseTaskID,comment);

        }
        else {
            await this.slackMessageService.postMessage(responseChatMessage,topic);
        }
    };

}
