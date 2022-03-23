import { feedbackInterface } from './feedback.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, delay, inject } from 'tsyringe';
import { MessageFlow } from '../get.put.message.flow.service';
import { MongoDBService } from '../mongodb.service';
import { SlackMessageService } from '../slack.message.service';
import { UserFeedback } from '../../models/user.feedback.model';

@autoInjectable()
export class FeedbackService implements feedbackInterface {

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(delay(() => MongoDBService)) public mongoDBService,
        private slackMessageService?: SlackMessageService){}

    async checkIntentAndSendFeedback(intent, message, channel, platformMessageService) {
        let initialThreeLettersOfIntent = "";
        for (let i = 0; i < 3; i++) {
            initialThreeLettersOfIntent += intent.charAt(i);
        }
        if (initialThreeLettersOfIntent === "QID" || initialThreeLettersOfIntent === "nsm" || initialThreeLettersOfIntent === "FAQ") {

            const saveMessage = message.messageBody;
            const sessionId = message.sessionId;
            const feedBackInfo = new UserFeedback({ userId: sessionId, message: saveMessage, channel: channel });
            await feedBackInfo.save();
            return this.triggerFeedbackIntent(message, channel, platformMessageService);
        }
        if (intent === "Feedback - Negative"){
            const response = await UserFeedback.findAll({ where: { userId: message.sessionId } });
            await this.slackMessageService.postMessage(response);
        }
    }

    triggerFeedbackIntent(message, channel, platformMessageService: platformServiceInterface) {
        message.messageBody = "suggestions";
        
        // eslint-disable-next-line max-len
        this.waiting(5000).then(() => this.messageFlow.processMessage(message, channel, platformMessageService).catch((err) => console.error(err)));
    }

    waiting(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        });
    }

}
