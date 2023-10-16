import { inject, Lifecycle, scoped } from 'tsyringe';
import { FireAndForgetService, QueueDoaminModel } from '../../fire.and.forget.service';
import { Logger } from '../../../common/logger';
import { AnswerYesMsgService } from './answer.yes.service';

@scoped(Lifecycle.ContainerScoped)
export class AnswerNoMsgService {

    constructor(
        @inject(AnswerYesMsgService) private answerYesMsgService?: AnswerYesMsgService,
    ){}

    async replyNoService (eventObj ): Promise<any> {
        try {
            const body : QueueDoaminModel =  {
                Intent : "Dmc_No",
                Body   : {
                    EventObj : eventObj
                }
            };

            const message = this.getRandomNoMessage();
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [message] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Maternity careplan registration service error');
        }

    }

    private getRandomNoMessage() {
        const messages = ["Thank you for your response.", "Thank you for your feedback.", "Your response has been recorded" ];
        const randomIndex = this.answerYesMsgService.generateRandomNumber(messages.length);
        return messages[randomIndex];
    }

}
