/* eslint-disable lines-around-comment */
/* eslint-disable max-len */
import { v2 } from '@google-cloud/translate';
import { UserLanguage } from './set.language';

let detected_language = 'en';
let dialogflow_language = "en-US";

export class translateService{

    private GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    private obj = {
        credentials : this.GCPCredentials,
        projectId   : this.GCPCredentials.project_id
    };

    detectLanguage = async (message:string) => {
        console.log("detect the language of: ", message);
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

    translateMessage = async (message:string, sessionId) => {
        console.log("entered the translateMessage of translateService JJJJJJJJJJJ", message);
        const translate = new v2.Translate(this.obj);
        const languageForSession = await new UserLanguage().setLanguageForSession(sessionId, message);
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
        console.log({ message, languageForSession });
        return { message, languageForSession };
    };

    processdialogflowmessage = async (message, detected_language) => {
        const translate = new v2.Translate(this.obj);
        console.log("entered the processdialogflowmessage of translateService JJJJJJJJJJJ");
        // eslint-disable-next-line init-declarations
        let translatedResponse;
        if (message.parse_mode) {
            translatedResponse = message.text;
        }
        else {
            translatedResponse = await this.translateResponse(translate, message, detected_language);
        }
        return translatedResponse;
    };

    translateResponse = async (translate, responseMessage, detected_language) => {
        console.log(`entered the translateResponse of translateService JJJJJJJJJJJ ${responseMessage} to language ${detected_language}`);
        try {
            if (detected_language !== 'en') {
                const [translation] = await translate.translate(responseMessage.text[0], { to: detected_language, format: "text" });
                responseMessage = [translation];
            }
            else {
                responseMessage = [responseMessage.text[0]];
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
