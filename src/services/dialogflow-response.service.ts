import dialogflow from '@google-cloud/dialogflow';
import { v4 } from 'uuid';
import { injectable } from 'tsyringe';
import { v2 } from '@google-cloud/translate';
import { text } from 'body-parser';
import { response } from 'express';
import path from 'path';
import { combineTableNames } from 'sequelize/types/lib/utils';
// const projectId = process.env.DIALOGFLOW_PROJECT_ID;
// const appSupportProjectId = process.env.DIALOGFLOW_PROJECT_ID_REAN_APP;
const translateProjectId = process.env.TRANSLATE_PROJECT_ID;
// A unique identifier for the given session


@injectable()
export class DialogflowResponseService {
    getDialogflowMessage = async (message, userSessionId = null, platform = null) => {
        console.log("this is message from getdialogflow................", message)
        try {
            // set default values
            let detected_language = 'en';        
            let responseMessage = { text: [], parse_mode: false, image: { url: '', caption:''} };
            let dialogflow_language = "en-US";
            const sessionId = userSessionId == null ? v4() : userSessionId;
            
            let sessionClient = null;
            let sessionPath = null;
            let translate = null
            console.log("the platform is PPPPPPPPPPPPPPPPPPPPPPPPPP",platform )
            let options = {};
            let projectIdFinal =null;

            if (platform == "REAN_SUPPORT") {
                translate = false
    
                // init session client for DF using manual explicit file for REAN Support App Bot
                // check docs here: node_modules/dialogflow/src/v2/sessions_client.js
                options = {
                    keyFilename: process.env.REAN_APP_SUPPORT_GCP_PROJ_CREDENTIALS
                }
                projectIdFinal = process.env.DIALOGFLOW_PROJECT_ID_REAN_APP;
                
            } else {
                console.log("Entered the else of Dialogflow..............")
    
                // init session client for DF using manual explicit file
                options = {
                    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
                }
                projectIdFinal = process.env.DIALOGFLOW_PROJECT_ID;;
                
            }
            sessionClient = new dialogflow.SessionsClient(options);
    
                // translate = await initializeTranslate(translateProjectId); ////////////////
            sessionPath = sessionClient.projectAgentSessionPath(projectIdFinal, sessionId);
            ///////////////////////
            // if (translate) {
            //     let [detections] = await translate.detect(message);
            //     console.log("this is detections", translate.detect(message))
            //     detections = Array.isArray(detections) ? detections : [detections];
            //     console.log("this is 2nd line detections", detections)
    
            //     detected_language = detections[0].language;
            //     console.log("the language is", detected_language)
            //     if (detected_language != 'en') {
            //         const target = 'en';
            //         let [translation] = await translate.translate(message, target);
            //         message = translation;
            //         dialogflow_language = "en-US";
            //     }
            // }
            //////////////////////////

            // let messagefordialogflow;
            // messagefordialogflow = await translateMessage(message)

            console.log("Message to be sent to DF: ", message)
            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: message,
                        languageCode: dialogflow_language,
                    },
                },
            };
            console.log("B$session CLient detects intent")
            const responses = await sessionClient.detectIntent(request);
            const result = responses[0].queryResult;
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
            } else {
                // console.log(`  No intent matched.`);
            }

            console.log("B$getFulfillmentResponse gets response")
            responseMessage = getFulfillmentResponse(result);
            if (responseMessage.text.length == 0) {
                responseMessage.text[0] = result.fulfillmentText;
            }
            // let translatedResponse; /////////////////
            // if (responseMessage.parse_mode) {
            //     translatedResponse = responseMessage.text;
            // }
            // else {
            //     translatedResponse = await translateResponse(translate, responseMessage.text, detected_language)
            // }//////////////////
            console.log("returned dialogflow,",responseMessage )
            return {
                text: responseMessage, //responseMessage
                image: responseMessage.image ? responseMessage.image : false,
                parse_mode: responseMessage.parse_mode ? responseMessage.parse_mode : false,
                result: result,
            }
        }
        catch (e) {
            console.log(e)
            return {
                text: ["Sorry, something went wrong. Let me consult an expert and get back to you!"],
                image:  {url: '', caption:''},
                parse_mode: false,
                result: false
            };
        }
    
    
    }

}
//
// async function initializeTranslate(translateProjectId) {
//     // return false;
//     try {
//         const translateObj = new v2.Translate({projectId: translateProjectId });
//         return translateObj
//     }
//     catch (e) {
//         return false;
//     }
// }
// //
// async function translateResponse(translate, responseMessage, detected_language) {
//     try {
//         if (detected_language != 'en') {
//             console.log("It is not english loop")
//             let [translation] = await translate.translate(responseMessage[0], { to: detected_language, format: "text" });
//             responseMessage = [translation];
//         }
//         return responseMessage;
//     } catch (e) {
//         console.log("catch translate", e);
//         return responseMessage;
//     }
// }
//


function getFulfillmentResponse(result) {
    let responseMessage = { text: [], parse_mode: false, image: { url: '', caption:''}};

    if (result.fulfillmentMessages) {
        if (result.fulfillmentMessages[0].platform && result.fulfillmentMessages[0].platform == "TELEGRAM" && result.fulfillmentMessages[0].payload) {
            responseMessage.text[0] = result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.text.stringValue;
            if (result.fulfillmentMessages[1]) {
                if (result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue && result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue == 'HTML') {
                    responseMessage.parse_mode = result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue;
                }
                if (result.fulfillmentMessages[1].text) responseMessage.text[1] = result.fulfillmentMessages[1].text.text[0];
                if (result.fulfillmentMessages[1].image) responseMessage.image = result.fulfillmentMessages[1].image.imageUri;
            }

        } else if (result.fulfillmentMessages[0] && result.fulfillmentMessages[0].text) {
            responseMessage.text[0] = result.fulfillmentMessages[0].text.text[0];
            if (result.fulfillmentMessages[1] && result.fulfillmentMessages[1].image) {
                responseMessage.image = { url: result.fulfillmentMessages[1].image.imageUri, caption: result.fulfillmentMessages[1].image.accessibilityText };
            }
        }
        else {
            responseMessage.text[0] = "Sorry, something went wrong. Let me consult an expert and get back to you."
        }
    }
    return responseMessage;
}
