/* eslint-disable max-len */
import { inject, Lifecycle, scoped } from 'tsyringe';
import { FireAndForgetService, QueueDoaminModel } from '../../fire.and.forget.service';
import { Logger } from '../../../common/logger';
import * as AssessmetUserResponses from './assessment.user.replies.json';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../../services/entity.manager.provider.service';
import { ChatMessage } from '../../../models/chat.message.model';

@scoped(Lifecycle.ContainerScoped)
export class AnswerYesMsgService {

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
    ){}

    async replyYesService (eventObj ): Promise<any> {
        try {
            const body : QueueDoaminModel =  {
                Intent : "Dmc_Yes",
                Body   : {
                    EventObj : eventObj
                }
            };

            let message = null;
            message = await this.getUserResponse(eventObj, message);
            if (message === null) {
                message = this.getRandomYesMessage();
            }
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [message] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Maternity careplan registration service error');
        }

    }

    public async getUserResponse(eventObj: any, message: string ) {
        const intentName = eventObj.body.queryResult ? eventObj.body.queryResult.intent.displayName : null;
        const channel = eventObj.body.originalDetectIntentRequest.payload.source;
        let chatMessageId = null;
        if (channel === "telegram" || channel === "Telegram") {
            chatMessageId = eventObj.body.originalDetectIntentRequest.payload.completeMessage.chat_message_id;
        } else {
            chatMessageId = eventObj.body.originalDetectIntentRequest.payload.contextId;
        }
        const userResponses = AssessmetUserResponses['default'];
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const chatMessage = await chatMessageRepository.findOne({ where: { "responseMessageID": chatMessageId } });

        if (channel === "telegram" || channel === "Telegram") {
            const previousMessage = chatMessage.messageContent ? chatMessage.messageContent : "";
            for (const msg of userResponses) {
                if (msg.Messege === previousMessage) {
                    message = this.getAnswer(intentName, message, msg);
                    break;
                } else {
                    message = null;
                }
            }
        } else {
            const metaTemplateName = chatMessage ? chatMessage.intent : "";
            for (const msg of userResponses) {
                if (msg.WhatsAppTemplateName === metaTemplateName) {
                    message = this.getAnswer(intentName, message, msg);
                    break;
                } else {
                    message = null;
                }
            }
        }
        
        return message;
    }

    private getAnswer(intentName: any, message: string, msg: any) {
        if (intentName === "Dmc_Yes") {
            message = msg.ReplyYesText;
        } else {
            message = msg.ReplyNoText;
        }
        return message;
    }

    public getRandomYesMessage() {
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
