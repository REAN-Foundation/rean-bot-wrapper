import { feedbackInterface } from './feedback.interface';
import { autoInjectable } from 'tsyringe';
import { SlackMessageService } from '../slack.message.service';
import { UserFeedback } from '../../models/user.feedback.model';
import { ChatMessage } from '../../models/chat.message.model';

@autoInjectable()
export class FeedbackService implements feedbackInterface {

    constructor(
        private slackMessageService?: SlackMessageService){}

    async NegativeFeedback(channel, sessionId) {
        return new Promise(async(resolve, reject) =>{
            try {
                const listOfUserRequestdata = await ChatMessage.findAll({ where: { userPlatformID: sessionId } });
                const message = listOfUserRequestdata[listOfUserRequestdata.length - 2].messageContent;
                const feedBackInfo = new UserFeedback({ userId: sessionId, message: message, channel: channel, feedbackType: "Negative Feedback" });
                await feedBackInfo.save();
                const response = await UserFeedback.findAll({ where: { userId: sessionId } });
                await this.slackMessageService.postMessage(response);
                const reply = "A message regarding your query has been sent to our experts. Will let you know when they reply";
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
