import { feedbackInterface } from './feedback.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, delay, inject } from 'tsyringe';
import { MessageFlow } from '../get.put.message.flow.service';

@autoInjectable()
export class FeedbackService implements feedbackInterface{

    constructor(@inject(delay(() => MessageFlow) ) public messageFlow){
    }

    checkIntentAndSendFeedback (intent,message,client,platformMessageService) {
        let initialThreeLettersOfIntent = "";
        for (let i = 0; i < 3; i++) {
            initialThreeLettersOfIntent += intent.charAt(i);
        }
        if (initialThreeLettersOfIntent === "QID"){
            // let message_to_platform = this.sendFeedback(intent,sessionId, platformMessageService);
            let message_to_platform = this.triggerFeedbackIntent(intent,message,client, platformMessageService);
            return message_to_platform
        }
        else {
            console.log("Intent is not QID")

        }
    }

    triggerFeedbackIntent(intent,message,client,platformMessageService: platformServiceInterface) {
        message.messageBody = "suggestions";
        this.waiting(5000).then(() => this.messageFlow.processMessage(message,client,platformMessageService).catch((err) => console.error(err)));
    }

    waiting (time){
        return new Promise ((resolve,reject) => {
            setTimeout(resolve,time);
        });
    }

}
