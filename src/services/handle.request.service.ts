// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DialogflowResponseService } from './dialogflow.response.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { translateService } from './translate.service';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class handleRequestservice{

    constructor(private DialogflowResponseService?: DialogflowResponseService,
                private translateService?: translateService ) {
    }

    async handleUserRequest (message, client) {
        const platform_id = message.sessionId;

        //get the translated message
        const translate_message = await this.translateService.translateMessage(message.messageBody);

        // eslint-disable-next-line max-len
        const message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, platform_id, client);
        const text_part_from_DF = message_from_dialoglow.text;

        // process the message from dialogflow before sending it to whatsapp
        // eslint-disable-next-line max-len
        const processed_message = await this.translateService.processdialogflowmessage(text_part_from_DF, translate_message.detected_language);

        return { processed_message, message_from_dialoglow };
    }

}
