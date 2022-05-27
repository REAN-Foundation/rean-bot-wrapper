// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DialogflowResponseService } from './dialogflow.response.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { translateService } from './translate.service';
import { autoInjectable } from 'tsyringe';
import { Imessage } from '../refactor/interface/message.interface';

@autoInjectable()
export class handleRequestservice{

    constructor(private DialogflowResponseService?: DialogflowResponseService,
                private translateService?: translateService ) {
    }

    async handleUserRequest (message: Imessage, channel: string) {
        const platform_id = message.sessionId;
        const userName = message.name;

        //get the translated message
        const translate_message = await this.translateService.translateMessage(message.messageBody, platform_id);

        // eslint-disable-next-line max-len
        const message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, platform_id, channel, userName);

        // process the message from dialogflow before sending it to whatsapp
        // eslint-disable-next-line max-len
        const processed_message = await this.translateService.processdialogflowmessage(message_from_dialoglow, translate_message.languageForSession);

        return { processed_message, message_from_dialoglow };
    }

}
