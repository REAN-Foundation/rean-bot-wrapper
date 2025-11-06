import { inject, Lifecycle, scoped } from 'tsyringe';
import { FireAndForgetService } from '../../fire.and.forget.service.js';
import type { QueueDoaminModel} from '../../fire.and.forget.service.js';
import { Logger } from '../../../common/logger.js';
import { AnswerYesMsgService } from './answer.yes.service.js';

@scoped(Lifecycle.ContainerScoped)
export class AnswerNoMsgService {

    constructor(
        @inject(AnswerYesMsgService) private answerYesMsgService?: AnswerYesMsgService,
    ){}

    async replyNoService (eventObj ): Promise<any> {
        try {
            const intentName = eventObj.body.queryResult ? eventObj.body.queryResult.intent.displayName : null;
            const body : QueueDoaminModel =  {
                Intent : intentName,
                Body   : {
                    EventObj : eventObj
                }
            };

            let message = null;
            message = await this.answerYesMsgService.getUserResponse(eventObj, message);
            if (message === null) {
                message = this.getRandomNoMessage();
            }
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [message] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Maternity careplan registration service error');
        }

    }

    private getRandomNoMessage() {
        const messages = ["Thank you for your response.", "Your response has been recorded" ];
        const randomIndex = this.answerYesMsgService.generateRandomNumber(messages.length);
        return messages[randomIndex];
    }

}
