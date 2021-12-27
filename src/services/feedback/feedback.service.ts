import { feedbackInterface } from './feedback.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, delay, inject } from 'tsyringe';
import { MessageFlow } from '../get.put.message.flow.service';

@autoInjectable()
export class FeedbackService implements feedbackInterface{

    constructor(@inject(delay(() => MessageFlow) ) public messageFlow){
    }

    checkIntentAndSendFeedback (intent,message,channel,platformMessageService) {
        let initialThreeLettersOfIntent = "";
        for (let i = 0; i < 3; i++) {
            initialThreeLettersOfIntent += intent.charAt(i);
        }
        if (initialThreeLettersOfIntent === "QID"){

            // let message_to_platform = this.sendFeedback(intent,sessionId, platformMessageService);
            return this.triggerFeedbackIntent(message, channel, platformMessageService);
        }
    }

    triggerFeedbackIntent(message,channel,platformMessageService: platformServiceInterface) {
        message.messageBody = "suggestions";
        // eslint-disable-next-line max-len
        this.waiting(5000).then(() => this.messageFlow.processMessage(message,channel,platformMessageService).catch((err) => console.error(err)));
    }

    waiting (time){
        return new Promise((resolve) => {
            setTimeout(resolve,time);
        });
    }

}
