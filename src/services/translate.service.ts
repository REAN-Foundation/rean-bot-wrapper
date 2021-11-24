import { v2 } from '@google-cloud/translate';
const translateProjectId = process.env.TRANSLATE_PROJECT_ID;
let detected_language = 'en';
let dialogflow_language = "en-US";

export class translateService{

    translateMessage = async (message) => {
        console.log("entered the translateMessage of translateService JJJJJJJJJJJ", message);
        const translate = new v2.Translate({ projectId: translateProjectId });
        console.log(`the response from v2.Translate is ${translate}`);
        const [detections] = await translate.detect(message);
        const detectedLanguage = await Array.isArray(detections) ? detections : [detections];

        detected_language = detectedLanguage[0].language;
        if (detected_language !== 'en') {
            const target = 'en';
            const [translation] = await translate.translate(message, target);
            message = translation;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            dialogflow_language = "en-US";
        }
        console.log("exited the translate msg");
        return { message, detected_language };
    }

    processdialogflowmessage = async (message, detected_language) => {
        const translate = new v2.Translate({ projectId: translateProjectId });
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
    }

    translateResponse = async (translate, responseMessage, detected_language) => {
        console.log("entered the translateResponse of translateService JJJJJJJJJJJ");
        try {
            if (detected_language !== 'en') {
                const [translation] = await translate.translate(responseMessage.text[0], { to: detected_language, format: "text" });
                console.log(`the response from v2.Translate.translate is ${[translation]}`);
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
    }

}
