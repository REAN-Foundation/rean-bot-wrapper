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
        if ( this.clientEnvironmentProviderService.getClientEnvironmentVariable("NLP_SERVICE") === "custom_ml_model"){
            const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
            const responseChatMessage = await chatMessageRepository.findAll({ where: { responseMessageID: contextID } });
            await this.supportChannel("ClickUp", responseChatMessage, message,null, tag);
        }
    }

    async NegativeFeedback(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                const humanHandoff: HumanHandoff = eventObj.container.resolve(HumanHandoff);
                const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
                const messageContent = eventObj.body.originalDetectIntentRequest.payload.completeMessage.messageBody;
                const payload = eventObj.body.originalDetectIntentRequest.payload;
                const userId = payload.userId;
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
                    const preferredSupportChannel = clientEnvironmentProviderService.getClientEnvironmentVariable("SUPPORT_CHANNEL");
                    if (payload.contextId){
                        responseChatMessage = await chatMessageRepository.findAll({ where: { responseMessageID: payload.contextId } });
                        await this.supportChannel(preferredSupportChannel,responseChatMessage, messageContent);
                    }
                    else {
                        const topic = responseChatMessage[responseChatMessage.length - 2].messageContent;
                        await this.supportChannel(preferredSupportChannel,responseChatMessage,messageContent,topic);
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
                const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(ChatMessage);
                const listOfUserRequestdata = await chatMessageRepository.findAll({ where: { userPlatformID: userId } });
                await chatMessageRepository.update({ feedbackType: "Positive Feedback" },{ where: { id: listOfUserRequestdata[listOfUserRequestdata.length - 1].id } });
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

    supportChannel = async(preferredSupportChannel, responseChatMessage, messageContent, topic = null,tag = null) => {
        if (preferredSupportChannel === "ClickUp"){
            const listID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CLICKUP_ISSUES_LIST_ID");
            const clickUpResponseTaskID:any = await this.clickuptask.createTask(responseChatMessage,topic,null,null, listID,tag);
            if (messageContent.length > 5){
                const comment = messageContent;
                await this.clickuptask.postCommentOnTask(clickUpResponseTaskID,comment);
            }
        }
        else {
            await this.slackMessageService.postMessage(responseChatMessage,topic);
        }
    };

}
