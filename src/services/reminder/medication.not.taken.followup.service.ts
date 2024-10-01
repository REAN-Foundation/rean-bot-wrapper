/* eslint-disable @typescript-eslint/no-unused-vars */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiInteractiveListService } from '../whatsappmeta.button.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { sendTelegramButtonService } from '../telegram.button.service';
import { Iresponse } from '../../refactor/interface/message.interface';

@scoped(Lifecycle.ContainerScoped)
export class MedicationStoppedReasonService {

    private _platformMessageService :  platformServiceInterface = null;

    async medicationStoppedReasonButtons (eventObj: any ) {
        try {
            const message = "Please select an option from below";
            const sessionId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            let messageType = "";
            let payload = null;
            let channelName = eventObj.body.originalDetectIntentRequest.payload.source;
            const whatsappButtonArray = ["I am done with the drug cycle", "Drug Cycle", "drug_cycle_done", "I forgot to take my meds", "Forgot","forgot_taking_meds", "I am out of mmedications and couldnot et refill", "Out Of Medicine", "out_of_meds", "I am tired of taking these drugs", "Tired Of Drugs", "tired_of_drugs", "I don't need them. I am good", "Meds Not Required", "meds_not_required", "I experience side effects", "Side Effects", "side_effects", "I have other illness so stopped taking these medications", "Other Illness","other_illness", "I have new drugs prescribed so not sure if it is ok to take my ARVs", "New Drugs Prescribed", "new_drugs_prescribed", "Not comfortable to continue medication in current environment", "Uncomfortable", "current_env_uncomfortable", "Trying out alternative therapy/ Herbal Medication", "Trying Alternatives", "trying_alternatives"];
            const buttonArray = ["I am done with the drug cycle", "drug_cycle_done", "I forgot to take my meds" ,"forgot_taking_meds", "I am out of mmedications and couldnot et refill","out_of_meds","I am tired of taking these drugs","tired_of_drugs", "I don't need them. I am good", "meds_not_required", "I experience side effects", "side_effects", "I have other illness so stopped taking these medications", "other_illness", "I have new drugs prescribed so not sure if it is ok to take my ARVs", "new_drugs_prescribed", "Not comfortable to continue medication in current environment", "current_env_uncomfortable","Trying out alternative therapy/ Herbal Medication", "trying_alternatives"];
            if (channelName === 'whatsappMeta') {
                payload = await sendApiInteractiveListService(whatsappButtonArray,true);
                messageType = 'interactivelist';
            } else if (channelName === "telegram" || channelName === "Telegram"){
                payload = await sendTelegramButtonService(buttonArray);
                messageType = 'inline_keyboard';
                channelName = "telegram";
            }
            else {
                throw new Error(`channel method not implemented: ${channelName}`);
            }
            payload["typeOfButton"] = "vertical";
            this._platformMessageService = eventObj.container.resolve(channelName);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = sessionId;
            response_format.messageText = message;
            response_format.message_type = messageType;
            await this._platformMessageService.SendMediaMessage(response_format, payload);
            return null;

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Medication stopped service error');
        }
    }

}
