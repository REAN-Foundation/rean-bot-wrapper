/* eslint-disable max-len */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DialogflowResponseService } from './dialogflow.response.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { translateService } from './translate.service';
import { autoInjectable } from 'tsyringe';
import { Imessage } from '../refactor/interface/message.interface';
import util from 'util';

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
        const message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, platform_id, channel, userName, message.intent);

        // this.getTranslatedResponse(message_from_dialoglow, translate_message.languageForSession);
        // process the message from dialogflow before sending it to whatsapp
        // eslint-disable-next-line max-len
        const processed_message = await this.processMessage(message_from_dialoglow, translate_message.languageForSession);
        // const processed_message = await this.translateService.processdialogflowmessage(message_from_dialoglow, translate_message.languageForSession);

        return { processed_message, message_from_dialoglow };
    }

    getTranslatedResponse(message_from_dialoglow, languageForSession){
        let payload = null;
        let customTranslations = null;
        if (message_from_dialoglow.result.fulfillmentMessages.length > 1) {
            if (message_from_dialoglow.result.fulfillmentMessages[1].payload !== undefined) {
                payload = message_from_dialoglow.result.fulfillmentMessages[1].payload;
                console.log("payload", util.inspect(payload.fields.translations));
                if (payload.fields.translations){
                    customTranslations = payload.fields.translations.structValue.fields[languageForSession].stringValue;
                    console.log("customTranslations", customTranslations);

                }

            }
        }
        return customTranslations;
    }

    async processMessage(message_from_dialoglow, languageForSession){
        const customTranslations = [this.getTranslatedResponse(message_from_dialoglow, languageForSession)];
        if (customTranslations[0] === null){
            const googleTranslate = await this.translateService.processdialogflowmessage(message_from_dialoglow, languageForSession);
            console.log("googleTranslate", googleTranslate);
            return googleTranslate;
        }
        else {
            console.log("customTranslations", customTranslations);
            return customTranslations;
        }
    }

}
