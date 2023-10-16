import { inject, Lifecycle, scoped } from 'tsyringe';
import { FireAndForgetService, QueueDoaminModel } from '../../fire.and.forget.service';
import { Logger } from '../../../common/logger';

@scoped(Lifecycle.ContainerScoped)
export class AnswerYesMsgService {

    async replyYesService (eventObj ): Promise<any> {
        try {
            const body : QueueDoaminModel =  {
                Intent : "Dmc_Yes",
                Body   : {
                    EventObj : eventObj
                }
            };

            const msg = this.getRandomYesMessage();
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [msg] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Maternity careplan registration service error');
        }

    }

    private getRandomYesMessage() {
        const messages = ["It sounds good.", "That's great to hear!", "You're doing great!", "You're awesome!", "Keep up the good work!"];
        const randomIndex = this.generateRandomNumber(messages.length);
        return messages[randomIndex];
    }

    public generateRandomNumber(maxNumber: number) {
        const now = new Date();
        const seed = now.getTime();
        const min = 0;
        const max = maxNumber - 1; // 10 + 1 (to include 10)
          
        // Use the seed to generate a random number
        const random = (seed % (max - min)) + min;
        return random;
    }

}
