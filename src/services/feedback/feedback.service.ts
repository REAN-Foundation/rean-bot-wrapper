/* eslint-disable max-len */
import { feedbackInterface } from './feedback.interface';
import { container, inject, Lifecycle, scoped } from 'tsyringe';
import { SlackMessageService } from '../slack.message.service';
import { UserFeedback } from '../../models/user.feedback.model';
import { ChatMessage } from '../../models/chat.message.model';
import { HumanHandoff } from '../../services/human.handoff.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { CalorieInfo } from '../../models/calorie.info.model';
import { Op } from 'sequelize';
import { ClickUpTask } from '../clickup/clickup.task';
import { EntityManagerProvider } from '../entity.manager.provider.service';

const humanHandoff: HumanHandoff = container.resolve(HumanHandoff);

@scoped(Lifecycle.ContainerScoped)
export class FeedbackService implements feedbackInterface {

    constructor(
        @inject(SlackMessageService) private slackMessageService?: SlackMessageService,
        @inject(ClickUpTask) private clickuptask?: ClickUpTask,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider
    ){}

    async NegativeFeedback(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
                const payload = eventObj.body.originalDetectIntentRequest.payload;
                const channel = payload.source;
                const userId = payload.userId;
                const completeMessage = payload.completeMessage;
                const client_name = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(ChatMessage);
                const listOfUserRequestdata = await chatMessageRepository.findAll({ where: { userPlatformID: userId } });
                const message = listOfUserRequestdata[listOfUserRequestdata.length - 3].messageContent;
                const userFeedbackRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(UserFeedback);
                await userFeedbackRepository.create({ userId: userId, messageContent: message, channel: channel,humanHandoff: "false", feedbackType: "Negative Feedback" });
                if (client_name === "CALORIE_BOT") {
                    console.log("Calorie negative feedback received.");
                    const response = await chatMessageRepository.findAll({ limit: 2, where: { userPlatformId: userId, direction: "In" }, raw: true, order: [['createdAt', 'DESC']] });
                    const negativeResponse = response[response.length - 1].messageContent;
                    const CalorieInfoRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(CalorieInfo);
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
                } else {
                    let response;
                    const userFeedbackRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(UserFeedback);
                    const chatMessageRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(ChatMessage);
                    const responseUserFeedback = await userFeedbackRepository.findAll({ where: { userId: userId } });
                    if (payload.source === "whatsapp" || payload.source === "whatsappMeta"){
                        if (payload.contextId){
                            response = await chatMessageRepository.findAll({ where: { whatsappResponseMessageId: payload.contextId } });
                        }
                        else if (completeMessage.whatsappResponseMessageId){
                            response = await chatMessageRepository.findAll({ where: { whatsappResponseMessageId: completeMessage.whatsappResponseMessageId } });
                        }
                        else {
                            response = responseUserFeedback;
                        }
                    }
                    else {
                        response = payload.contextId ? await chatMessageRepository.findAll({ where: { telegramResponseMessageId: payload.contextId } }) : responseUserFeedback;
                    }
                    const preferredSupportChannel = clientEnvironmentProviderService.getClientEnvironmentVariable("SUPPORT_CHANNEL");
                    if (preferredSupportChannel === "ClickUp"){
                        const clickUpResponse:any = await this.clickuptask.createTask(response, responseUserFeedback,null,null);
                        const messageContent = listOfUserRequestdata[listOfUserRequestdata.length - 1].messageContent;
                        if (messageContent.length > 5){
                            const comment = messageContent;
                            this.clickuptask.postCommentOnTask(clickUpResponse.body.id,comment);
                        }
                    }
                    else {
                        await this.slackMessageService.postMessage(response);
                    }
                    if (await humanHandoff.checkTime() === "false"){
                        const reply = "We have recorded your feedback. Our experts will get back to you on this issue";
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
                                                    "id"    : "001"
                                                },
                                                "type" : "reply"
                                            },
                                            {
                                                "type"  : "reply",
                                                "reply" : {
                                                    "title" : "No",
                                                    "id"    : "002"
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

    async PositiveFeedback(channel, sessionId) {
        return new Promise(async(resolve, reject) =>{
            try {
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(ChatMessage);
                const userFeedbackRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(UserFeedback);
                const listOfUserRequestdata = await chatMessageRepository.findAll({ where: { userPlatformID: sessionId } });
                const message = listOfUserRequestdata[listOfUserRequestdata.length - 2].messageContent;
                await userFeedbackRepository.create({ userId: sessionId, messageContent: message, channel: channel, feedbackType: "Positive Feedback" });
                const reply = "We are glad that you like it. Thank you for your valuable feedback";
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

}
