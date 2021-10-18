import { v2 } from '@google-cloud/translate';
const translateProjectId = process.env.TRANSLATE_PROJECT_ID;

let detected_language = 'en';
let dialogflow_language = "en-US";
let translate = null;


export class translateService{

    translateMessage = async (message) => {
        const translate = new v2.Translate({projectId: translateProjectId });
        let [detections] = await translate.detect(message);
        let detectedLanguage = await Array.isArray(detections) ? detections : [detections];
    
        detected_language = detectedLanguage[0].language;
        console.log("the language isppppppppppppppppppppppppppp", detected_language)
        if (detected_language != 'en') {
            const target = 'en';
            let [translation] = await translate.translate(message, target);
            message = translation;
            dialogflow_language = "en-US";
        }
        return {message, detected_language};
    }
    
    processdialogflowmessage = async (message) => {
        let translatedResponse;
        if (message.parse_mode) {
            translatedResponse = message.text;
            console.log("the response messageooooooooooooooooooooooooooo", translatedResponse)
        }
        else {
            translatedResponse = await this.translateResponse(translate, message.text, detected_language)
            console.log("the response message eeeeeeeeeeeeeeeeeeeeeeeeeeeeee", translatedResponse)
        }
    return translatedResponse;
    }

    translateResponse = async (translate, responseMessage, detected_language) => {
        try {
            if (detected_language != 'en') {
                let [translation] = await translate.translate(responseMessage[0], { to: detected_language, format: "text" });
                responseMessage = [translation];
            }
            return responseMessage;
        } catch (e) {
            console.log("catch translate", e);
            return responseMessage;
        }
    }
}