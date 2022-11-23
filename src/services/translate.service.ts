/* eslint-disable lines-around-comment */
/* eslint-disable max-len */
import { v2 } from '@google-cloud/translate';
import { UserLanguage } from './set.language';
import { DialogflowResponseFormat } from './response.format/dialogflow.response.format';

let detected_language = 'en';
let dialogflow_language = "en-US";

export class translateService{

    private GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    private obj = {
        credentials : this.GCPCredentials,
        projectId   : this.GCPCredentials.project_id
    };

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
    }

    translateMessage = async (messageType, message:string, sessionId) => {
        const translate = new v2.Translate(this.obj);
        const languageForSession = await new UserLanguage().setLanguageForSession(messageType, sessionId, message);
        console.log("languageForSession", languageForSession);
        // if (languageForSession === "change language") {
        //     const message = "change language";
        //     console.log({ message, detected_language });
        //     return { message, detected_language };
        // }
        if (languageForSession !== 'en') {
            const target = 'en';
            const [translation] = await translate.translate(message, target);
            message = translation;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            dialogflow_language = "en-US";
        }

        console.log("exited the translate msg");
        return { message, languageForSession };
    };

    processdialogflowmessage = async (messageFromDialogflow: DialogflowResponseFormat, detected_language: string) => {
        const translate = new v2.Translate(this.obj);
        // console.log("entered the processdialogflowmessage of translateService JJJJJJJJJJJ", message);
        // eslint-disable-next-line init-declarations
        let translatedResponse;
        const parse_mode = messageFromDialogflow.getParseMode();
        const text = messageFromDialogflow.getText();
        if (parse_mode) {
            translatedResponse = text;
        }
        else {
            translatedResponse = await this.translateResponse(translate, text, detected_language);
        }
        console.log("translatedResponse",translatedResponse);
        return translatedResponse;
    };

    translatePushNotifications = async ( message: string, phoneNumber: string) => {
        console.log(`entered the translation of push notification JJJJJJJJJJJ`);
        try {
            const translate = new v2.Translate(this.obj);
            let languageForSession = await new UserLanguage().getPreferredLanguageofSession(phoneNumber);
            console.log("languageForSession before", languageForSession);

            languageForSession = languageForSession !== 'null' ? languageForSession : 'en';
            console.log("languageForSession after", languageForSession);
            const responseMessage = this.translateResponse(translate, [message], languageForSession);
            return responseMessage;

        } catch (e) {
            console.log("catch translate", e);
            return "en";
        }
    };

    translateResponse = async (translate, responseMessage: string[], detected_language: string) => {
        console.log(`entered the translateResponse of translateService JJJJJJJJJJJ`);
        try {
            if (detected_language !== 'en') {
                const [translation] = await translate.translate(responseMessage[0], { to: detected_language, format: "text" });
                responseMessage = [translation];
            }
            else {
                responseMessage = [responseMessage[0]];
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

}
