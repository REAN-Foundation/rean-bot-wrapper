/* eslint-disable max-len */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DialogflowResponseService } from './dialogflow.response.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { translateService } from './translate.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Imessage } from '../refactor/interface/message.interface';
import { ChatSession } from '../models/chat.session';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { OpenAIResponseService } from './openai.response.service';
import { IserviceResponseFunctionalities } from "./response.format/response.interface";

@scoped(Lifecycle.ContainerScoped)
export class handleRequestservice{

    // constructor(
    constructor(
        @inject(DialogflowResponseService) private DialogflowResponseService?: DialogflowResponseService,
        @inject(translateService) private translateService?: translateService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(OpenAIResponseService) private openAIResponseService?: OpenAIResponseService) {
    }

    async handleUserRequest (message: Imessage, channel: string) {
        const platform_id = message.platformId;

        //get the translated message
        const translate_message = await this.translateService.translateMessage(message.type, message.messageBody, platform_id);

        let message_from_nlp:IserviceResponseFunctionalities = null;
        const nlpService = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NLP_SERVICE");
        if (nlpService && nlpService === "openai"){
            message_from_nlp = await this.openAIResponseService.getOpenaiMessage(translate_message.message);
        }
        else {
            // eslint-disable-next-line max-len
            message_from_nlp = await this.DialogflowResponseService.getDialogflowMessage(translate_message.message, channel, message.intent,message);
            if (message_from_nlp.getIntent() === "Default Fallback Intent"){
                message_from_nlp = await this.openAIResponseService.getOpenaiMessage(translate_message.message);
            }
            console.log("message_from_nlp",message_from_nlp);
        }

        // process the message from dialogflow before sending it to whatsapp
        const processed_message = await this.processMessage(message_from_nlp, platform_id);

        return { processed_message, message_from_nlp };
    }

    getTranslatedResponse(message_from_nlp, languageForSession){
        let customTranslations = null;
        const payload = message_from_nlp.getPayload();
        if (payload) {
            if (payload.fields.customTranslations){
                customTranslations = payload.fields.translations.structValue.fields[languageForSession].stringValue;
            }
        }
        return customTranslations;
    }

    async processMessage(message_from_nlp, platformId){
        const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
        const languagefromdb = await chatSessionRepository.findAll({
            where : {
                userPlatformID : platformId,
                sessionOpen    : 'true'
            }
        });
        const languageForSession = languagefromdb[languagefromdb.length - 1].preferredLanguage;
        const customTranslations = [this.getTranslatedResponse(message_from_nlp, languageForSession)];
        if (customTranslations[0] === null){
            const googleTranslate = await this.translateService.processdialogflowmessage(message_from_nlp, languageForSession);
            console.log("googleTranslate", googleTranslate);
            return googleTranslate;
        }
        else {
            console.log("customTranslations", customTranslations);
            return customTranslations;
        }
    }

}
