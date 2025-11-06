/* eslint-disable @typescript-eslint/no-unused-vars */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { sendApiButtonService } from '../whatsappmeta.button.service.js';
import { commonResponseMessageFormat } from '../common.response.format.object.js';
import { sendTelegramButtonService } from '../telegram.button.service.js';
import type { Iresponse } from '../../refactor/interface/message.interface.js';

@scoped(Lifecycle.ContainerScoped)
export class HeartFailureCareplanService {

    private _platformMessageService :  platformServiceInterface = null;

    async sendRegistrationMsg (eventObj: any ) {
        try {
            const message = "Your Heart Failure Care Plan is ready!  ❤️ \nAre you ready to start tracking your symptoms and managing your medications more effectively? Click here to activate your plan and take the next step toward better heart health. 🌟";
            const userId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            let messageType = "";
            let payload = null;
            let channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const buttonArray = ["Register in Careplan", "Start_Careplan_HF"];
            if (channel === 'whatsappMeta') {
                payload = await sendApiButtonService(buttonArray);
                messageType = 'interactivebuttons';
            } else {
                payload = await sendTelegramButtonService(buttonArray);
                messageType = 'inline_keyboard';
            }
            if (channel === "telegram" || channel === "Telegram") {
                channel = "telegram";
            }
            payload["typeOfButton"] = "vertical";

            this._platformMessageService = eventObj.container.resolve(channel);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = userId;
            response_format.messageText = message;
            response_format.message_type = messageType;
            await this._platformMessageService.SendMediaMessage(response_format, payload);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Medication reminder service error');
        }
    }

}