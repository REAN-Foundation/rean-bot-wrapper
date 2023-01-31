/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { DialogflowResponseService } from './dialogflow.response.service';
import { translateService } from './translate.service';
import { autoInjectable } from 'tsyringe';
import { Imessage } from '../refactor/interface/message.interface';
import { ChatSession } from '../models/chat.session';

@autoInjectable()
export class handleRequestservice{

    // constructor(
    constructor(
        private DialogflowResponseService?: DialogflowResponseService,
        private translateService?: translateService) {
    }

    async handleUserRequest (message: Imessage, channel: string) {
        const platform_id = message.platformId;

        //get the translated message
        const translate_message = await this.translateService.translateMessage(message.type, message.messageBody, platform_id);

        // eslint-disable-next-line max-len
        const message_from_dialoglow = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, channel, message.intent,message);

        // this.getTranslatedResponse(message_from_dialoglow, translate_message.languageForSession);
        // process the message from dialogflow before sending it to whatsapp
        const processed_message = await this.processMessage(message_from_dialoglow, platform_id);

        return { processed_message, message_from_dialoglow };
    }

    getTranslatedResponse(message_from_dialoglow, languageForSession){
        let customTranslations = null;
        const payload = message_from_dialoglow.getPayload();
        if (payload) {
            if (payload.fields.customTranslations){
                customTranslations = payload.fields.translations.structValue.fields[languageForSession].stringValue;
            }
        }
        return customTranslations;
    }

    async processMessage(message_from_dialoglow, platformId){
        const languagefromdb = await ChatSession.findAll({
            where : {
                userPlatformID : platformId,
                sessionOpen    : 'true'
            }
        });
        const languageForSession = languagefromdb[languagefromdb.length - 1].preferredLanguage;
        const customTranslations = [this.getTranslatedResponse(message_from_dialoglow, languageForSession)];
        if (customTranslations[0] === null){
            const googleTranslate = await this.translateService.processdialogflowmessage(message_from_dialoglow, languageForSession);
            return googleTranslate;
        }
        else {
            return customTranslations;
        }
    }

}
