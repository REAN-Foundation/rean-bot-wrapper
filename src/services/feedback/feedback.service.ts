import { feedbackInterface } from './feedback.interface';
import { autoInjectable, container } from 'tsyringe';
import { SlackMessageService } from '../slack.message.service';
import { UserFeedback } from '../../models/user.feedback.model';
import { ChatMessage } from '../../models/chat.message.model';
import { HumanHandoff } from '../../services/human.handoff.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { CalorieInfo } from '../../models/calorie.info.model';
import { Op } from 'sequelize';

const humanHandoff: HumanHandoff = container.resolve(HumanHandoff);
// eslint-disable-next-line max-len
const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);

@autoInjectable()
export class FeedbackService implements feedbackInterface {

    constructor(
        private slackMessageService?: SlackMessageService){}

    async NegativeFeedback(channel, userId) {
        return new Promise(async(resolve, reject) =>{
            try {
                const client_name = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
                const listOfUserRequestdata = await ChatMessage.findAll({ where: { userPlatformID: userId } });
                const message = listOfUserRequestdata[listOfUserRequestdata.length - 3].messageContent;
                const feedBackInfo = new UserFeedback({ userId: userId, message: message, channel: channel,humanHandoff: "false", feedbackType: "Negative Feedback"});
                await feedBackInfo.save();
                if (client_name === "CALORIE_BOT") {
                    console.log("Calorie negative feedback received.");
                    const response = await ChatMessage.findAll({limit :2, where : {userPlatformId: userId, direction: "In"}, raw: true, order: [['createdAt', 'DESC']]});
                    const negativeResponse = response[response.length-1].messageContent;
                    const findit = await CalorieInfo.findOne(
                        {
                            where : {user_food_name: { [Op.like]: `${negativeResponse}`}},
                            order : [['updatedAt', 'DESC']],
                            limit : 1,
                        }).then(function (record) {
                        return record.update({negative_feedback:1});
                    });
                    const data = {
                        "fulfillmentMessages" : [
                            {
                                "text" : {
                                    "text" : [
                                        "Thank you for your feedback. We are working towards providing a better experience."
                                    ]
                                }
                            }
                        ]
                    };
                    resolve(data);
                } else {
                    const response = await UserFeedback.findAll({ where: { userId: userId } });
                    await this.slackMessageService.postMessage(response);
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
                const listOfUserRequestdata = await ChatMessage.findAll({ where: { userPlatformID: sessionId } });
                const message = listOfUserRequestdata[listOfUserRequestdata.length - 2].messageContent;
                const feedBackInfo = new UserFeedback({ userId: sessionId, message: message, channel: channel, feedbackType: "Positive Feedback" });
                await feedBackInfo.save();
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
