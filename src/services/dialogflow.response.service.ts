import dialogflow from '@google-cloud/dialogflow';
import { v4 } from 'uuid';
import { injectable } from 'tsyringe';
@injectable()
export class DialogflowResponseService {

    getDialogflowMessage = async (message, userSessionId = null, platform = null) => {
        try {

            // set default values
            let responseMessage = { text: [], parse_mode: false, image: { url: '', caption: '' } };
            const dialogflow_language = "en-US";
            const sessionId = userSessionId === null ? v4() : userSessionId;

            let sessionClient = null;
            let sessionPath = null;
            let options = {};
            let projectIdFinal = null;

            if (platform === "REAN_SUPPORT") {
                options = {
                    keyFilename : process.env.REAN_APP_SUPPORT_GCP_PROJ_CREDENTIALS
                };
                projectIdFinal = process.env.DIALOGFLOW_PROJECT_ID_REAN_APP;

            } else {
                console.log("Entered the else of Dialogflow..............");
                options = {
                    keyFilename : process.env.GOOGLE_APPLICATION_CREDENTIALS
                };
                projectIdFinal = process.env.DIALOGFLOW_PROJECT_ID;

            }
            sessionClient = new dialogflow.SessionsClient(options);
            sessionPath = sessionClient.projectAgentSessionPath(projectIdFinal, sessionId);
            console.log("Message to be sent to DF: ", message);
            const request = {
                session    : sessionPath,
                queryInput : {
                    text : {
                        text         : message,
                        languageCode : dialogflow_language,
                    },
                },
            };
            console.log("B$session CLient detects intent");
            const responses = await sessionClient.detectIntent(request);
            const result = responses[0].queryResult;
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
            } else {

                // console.log(`  No intent matched.`);
            }

            console.log("B$getFulfillmentResponse gets response");
            responseMessage = getFulfillmentResponse(result);
            if (responseMessage.text.length === 0) {
                responseMessage.text[0] = result.fulfillmentText;
            }
            console.log("returned dialogflow,",responseMessage );
            return {
                text       : responseMessage,
                image      : responseMessage.image ? responseMessage.image : false,
                parse_mode : responseMessage.parse_mode ? responseMessage.parse_mode : false,
                result     : result,
            };
        }
        catch (e) {
            console.log(e);
            return {
                text       : ["Sorry, something went wrong. Let me consult an expert and get back to you!"],
                image      : { url: '', caption: '' },
                parse_mode : false,
                result     : false
            };
        }

    }

}

function getFulfillmentResponse(result) {
    const responseMessage = { text: [], parse_mode: false, image: { url: '', caption: '' } };

    if (result.fulfillmentMessages) {
        if (result.fulfillmentMessages[0].platform && result.fulfillmentMessages[0].platform === "TELEGRAM" && result.fulfillmentMessages[0].payload) {
            // eslint-disable-next-line max-len
            responseMessage.text[0] = result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.text.stringValue;
            if (result.fulfillmentMessages[1]) {
                if (result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue && result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue === 'HTML') {
                    // eslint-disable-next-line max-len
                    responseMessage.parse_mode = result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue;
                }
                // eslint-disable-next-line max-len
                if (result.fulfillmentMessages[1].text) responseMessage.text[1] = result.fulfillmentMessages[1].text.text[0];
                // eslint-disable-next-line max-len
                if (result.fulfillmentMessages[1].image) responseMessage.image = result.fulfillmentMessages[1].image.imageUri;
            }

        } else if (result.fulfillmentMessages[0] && result.fulfillmentMessages[0].text) {
            responseMessage.text[0] = result.fulfillmentMessages[0].text.text[0];
            if (result.fulfillmentMessages[1] && result.fulfillmentMessages[1].image) {
                // eslint-disable-next-line max-len
                responseMessage.image = { url: result.fulfillmentMessages[1].image.imageUri, caption: result.fulfillmentMessages[1].image.accessibilityText };
            }
        }
        else {
            responseMessage.text[0] = "Sorry, something went wrong. Let me consult an expert and get back to you.";
        }
    }
    return responseMessage;
}
