/* eslint-disable lines-around-comment */
/* eslint-disable max-len */
import { v2, TranslationServiceClient } from '@google-cloud/translate';
import { UserLanguage } from './set.language';
import { DialogflowResponseFormat } from './response.format/dialogflow.response.format';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';

let detected_language = 'en';
let dialogflow_language = "en-US";

@scoped(Lifecycle.ContainerScoped)
export class translateService{

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(UserLanguage) private userLanguage?: UserLanguage
    ) {}

    private GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    private obj = {
        credentials : this.GCPCredentials,
        projectId   : this.GCPCredentials.project_id
    };

    private translated_message;

    private translateGlossaryId: string;

    async getDialogflowLanguage(){
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE")){
            return this.clientEnvironmentProviderService.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE");
        }
        else {
            return "en";
        }

    }

    detectLanguage = async (message:string) => {

        //this is a temp solution for detecting the "hindi" and "Hindi" as english as Google translate detects it as Filipino
        if (message === "Hindi" || message === "hindi" ) {
            return detected_language = "en";
        }
        else {
            const translate = new v2.Translate(this.obj);
            const [detections] = await translate.detect(message);
            const detectedLanguage = await Array.isArray(detections) ? detections : [detections];
            detected_language = detectedLanguage[0].language;
            console.log("The detected language is!!!!!!!!!!!!!", detected_language);
            detected_language = await this.checkLanguage(detected_language);
            return detected_language;
        }
    };

    translateMessage = async (messageType, message:string, sessionId) => {
        const defultLanguage = await this.getDialogflowLanguage();
        const translate = new v2.Translate(this.obj);
        const languageForSession = await this.userLanguage.setLanguageForSession(messageType, sessionId, message);
        console.log("languageForSession", languageForSession);
        // if (languageForSession === "change language") {
        //     const message = "change language";
        //     console.log({ message, detected_language });
        //     return { message, detected_language };
        // }
        if (languageForSession !== defultLanguage) {
            const target = defultLanguage;
            const [translation] = await translate.translate(message, target);
            message = translation;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            dialogflow_language = defultLanguage;
            console.log("dialogflow_language", dialogflow_language);
        }

        console.log("exited the translate msg");
        return { message, languageForSession };
    };

    async translatestring(string,targetLanguagecode){
        const translate = new v2.Translate(this.obj);
        const [translation] = await translate.translate(string, targetLanguagecode);
        const translatedString = translation;
        return translatedString;

    }

    processdialogflowmessage = async (messageFromDialogflow: DialogflowResponseFormat, detected_language: string) => {
        console.log("entered the processdialogflowmessage of translateService JJJJJJJJJJJ");
        // eslint-disable-next-line init-declarations
        let translatedResponse;
        const intent = messageFromDialogflow.getIntent();
        const parse_mode = messageFromDialogflow.getParseMode();
        const text = messageFromDialogflow.getText();
        const customTranslateSetting: boolean = this.clientEnvironmentProviderService.getClientEnvironmentVariable("FIX_LANGUAGE") === "true";
        const listOfNoTranslateIntents = this.clientEnvironmentProviderService.getClientEnvironmentVariable("FIX_LANGUAGE_INTENTS") ?? [];
        if (parse_mode) {
            translatedResponse = text;
        } else if (listOfNoTranslateIntents.includes(intent) && customTranslateSetting){
            translatedResponse = text;
        } else {
            translatedResponse = await this.translateResponse(text, detected_language);
        }
        return translatedResponse;
    };

    translatePushNotifications = async ( message: string, phoneNumber: string) => {
        try {
            let languageForSession = await this.userLanguage.getPreferredLanguageofSession(phoneNumber);
            console.log("languageForSession before", languageForSession);

            languageForSession = languageForSession !== 'null' ? languageForSession : 'en';
            console.log("languageForSession after", languageForSession);
            const responseMessage = this.translateResponse([message], languageForSession);
            return responseMessage;

        } catch (e) {
            console.log("catch translate", e);
            return "en";
        }
    };

    detectUsersLanguage = async ( phoneNumber: string) => {
        const defultLanguage = await this.getDialogflowLanguage();
        try {
            let languageForSession = await this.userLanguage.getPreferredLanguageofSession(phoneNumber);
            console.log("languageForSession before", languageForSession);

            languageForSession = languageForSession !== 'null' ? languageForSession : this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
            console.log("languageForSession after", languageForSession);
            return languageForSession;

        } catch (e) {
            console.log("catch translate", e);
            return defultLanguage;
        }
    };

    translateResponse = async (responseMessage: string[], detected_language: string) => {
        console.log(`entered the translateResponse of translateService JJJJJJJJJJJ`);
        const responseLanguage = await this.detectLanguage(responseMessage[0]);
        const defultLanguage = await this.getDialogflowLanguage();
        const translate = new v2.Translate(this.obj);
        this.translateGlossaryId = this.clientEnvironmentProviderService.getClientEnvironmentVariable("TRANSLATE_GLOSSARY");
        const customTranslateSetting: boolean = this.clientEnvironmentProviderService.getClientEnvironmentVariable("FIX_LANGUAGE") === "true";
        try {
            if (customTranslateSetting) {
                responseMessage = [responseMessage[0]];
            } else {
                if (detected_language !== defultLanguage) {
                    if (this.translateGlossaryId) {
                        this.translated_message = await this.translateTextWithGlossary(responseMessage[0], detected_language, translate); 
                    } else {
                        this.translated_message = await translate.translate(responseMessage[0], { to: detected_language, format: "text" });
                    }
                    const [translation] = this.translated_message;
                    responseMessage = [translation];
                }
                else if (responseLanguage !== detected_language) {
                    this.translated_message = await translate.translate(responseMessage[0], { to: detected_language, format: "text" });
                    const [translation] = this.translated_message;
                    responseMessage = [translation];
                }
                else {
                    responseMessage = [responseMessage[0]];
                }
            }

            return responseMessage;
        } catch (e) {
            console.log("catch translate", e);
            return responseMessage;
        }
    };

    checkLanguage = async (language:string) => {
        if (language === "und"){
            return language = "en";
        }
        else {
            return language;
        }
    };

    translateTextWithGlossary = async(message: string, target_language: string, translate: any, ) => {
        const translationClient = new TranslationServiceClient(this.obj);
        const projectId = this.GCPCredentials.project_id;
        const location = 'us-central1';
        const glossaryId = this.translateGlossaryId;
        const glossaryConfig = {
            glossary : `projects/${projectId}/locations/${location}/glossaries/${glossaryId}`,
        };
        const request = {
            parent             : `projects/${projectId}/locations/${location}`,
            contents           : [message],
            mimeType           : 'text/plain', // mime types: text/plain, text/html
            sourceLanguageCode : 'en',
            targetLanguageCode : target_language,
            glossaryConfig     : glossaryConfig,
        };
        try {
            const [response] = await translationClient.translateText(request);

            const glossary_response = response.glossaryTranslations[0].translatedText;
        
            return [glossary_response];
        } catch {
            const translated_response = await translate.translate(message, { to: target_language, format: "text" });

            return translated_response;
        }
    };

}
