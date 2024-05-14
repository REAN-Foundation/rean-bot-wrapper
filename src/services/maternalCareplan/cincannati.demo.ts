import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import * as CincinnatiMessages from './cincinnati.message.json';
import { translateService } from '../translate.service';
import { sendTelegramButtonService } from '../telegram.button.service';

@scoped(Lifecycle.ContainerScoped)
export class CincinnatiPerMinMsgService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
        @inject(translateService) private translate?: translateService,
    ) {}

    async registrationService (eventObj): Promise<any> {
        try {

            const body : QueueDoaminModel =  {
                Intent : "cincinnati_PerMinMsg",
                Body   : {
                    EventObj : eventObj
                }
            };

            const registrationMessage = `Thank you for participating in this RHD nurse ultrasound assessment test! Your expertise in identifying key features of RHD (rheumatic heart disease) is valuable.\n -You will be presented with several black and white ultrasound images of the heart.\n -Each image will be accompanied by a single question related to RHD assessment.\n -Please answer each question with a simple "Yes" or "No."\n -There are no time limits, but please answer to the best of your ability.`;
            FireAndForgetService.enqueue(body);
            return { fulfillmentMessages: [{ text: { text: [registrationMessage] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'per min service error');
        }

    }

    async collectMessage(eventObj) {
        const cincinnatiMessages = CincinnatiMessages['default'];
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        await this.timer(1000);
        const sequenceMsg = cincinnatiMessages.sort((a, b) => a.Sequence - b.Sequence);
        for (const msg of sequenceMsg) {
            await this.sendMessage(msg, eventObj);
            await this.timer(60000);
        }
    }

    private timer = ms => new Promise(res => setTimeout(res, ms));

    async sendMessage(this: any, msg:any , eventObj) {
        const response_format: Iresponse = commonResponseMessageFormat();
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        if (payload.source === "telegram" || payload.source === "Telegram") {
            payload.source = "telegram";
        }
        this._platformMessageService = eventObj.container.resolve(payload.source);
        const name : string = payload.userName;
        response_format.platform = payload.source;
        response_format.sessionId = payload.userId;
        response_format.messageText = `Hi ` + `${name},` + `\n` + msg.Message;
        response_format.message_type = "inline_keyboard";
        const buttonPayload = await sendTelegramButtonService(msg.ButtonArray);
        await this._platformMessageService.SendMediaMessage(response_format,  buttonPayload);
    }
    
}

export interface MessageDomainModel {
    Sequence : number;
    Message  : string;
}
