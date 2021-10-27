import { v2 } from '@google-cloud/translate';
const translateProjectId = process.env.TRANSLATE_PROJECT_ID;

let detected_language = 'en';
let dialogflow_language = "en-US";
let translate = null;


export class translateService{

    translateMessage = async (message) => {
        console.log("entered the translateMessage of translateService JJJJJJJJJJJ", message)
        const translate = new v2.Translate({projectId: translateProjectId });
        console.log("before entering translate.detect")
        let [detections] = await translate.detect(message);
        console.log("after entering translate.detect")
        let detectedLanguage = await Array.isArray(detections) ? detections : [detections];
    
        detected_language = detectedLanguage[0].language;
        // console.log("the language isppppppppppppppppppppppppppp", detected_language)
        if (detected_language != 'en') {
            const target = 'en';
            let [translation] = await translate.translate(message, target);
            message = translation;
            dialogflow_language = "en-US";
        }
        console.log("exited the translate msg")
        return {message, detected_language};
    }
    
    processdialogflowmessage = async (message, detected_language) => {
        const translate = new v2.Translate({projectId: translateProjectId });
        console.log("entered the processdialogflowmessage of translateService JJJJJJJJJJJ")
        let translatedResponse;
        if (message.parse_mode) {
            translatedResponse = message.text;
            // console.log("the response messageooooooooooooooooooooooooooo", translatedResponse)
        }
        else {
            translatedResponse = await this.translateResponse(translate, message, detected_language)
            // console.log("the response message eeeeeeeeeeeeeeeeeeeeeeeeeeeeee", translatedResponse)
        }
    return translatedResponse;
    }

    translateResponse = async (translate, responseMessage, detected_language) => {
        console.log("entered the translateResponse of translateService JJJJJJJJJJJ")
        try {
            if (detected_language != 'en') {
                let [translation] = await translate.translate(responseMessage.text[0], { to: detected_language, format: "text" });
                responseMessage = [translation];
            }
            else{
                responseMessage = [responseMessage.text[0]]
            }
            return responseMessage;
        } catch (e) {
            console.log("catch translate", e);
            return responseMessage;
        }
    }
}