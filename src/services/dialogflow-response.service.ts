import dialogflow from '@google-cloud/dialogflow';
import { v4 } from 'uuid';
import { injectable } from 'tsyringe';
import { v2 } from '@google-cloud/translate';

@injectable()
export class DialogflowResponseService {
    getDialogflowMessage = async (message, userSessionId = null) => {
        try {
            const translateProjectId = process.env.TRANSLATE_PROJECT_ID;
            const projectId = process.env.DIALOGFLOW_PROJECT_ID;

            const sessionId = userSessionId == null ? v4() : userSessionId;
            const sessionClient = new dialogflow.SessionsClient();
            const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

            const translate = new v2.Translate({ projectId: translateProjectId });
            const [detections] = await translate.detect(message);
            const detectionsArray = Array.isArray(detections) ? detections : [detections];

            const responseMessage = [];
            let detected_language = 'en';
            detected_language = detectionsArray[0].language;
            let dialogflow_language = 'en-US';
            if (detected_language != 'en') {
                const target = 'en';
                const [translation] = await translate.translate(message, target);
                message = translation;
                dialogflow_language = 'en-US';
            }

            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: message,
                        languageCode: dialogflow_language,
                    },
                },
            };

            const responses = await sessionClient.detectIntent(request);
            const result = responses[0].queryResult;
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
            } else {
                // console.log(`  No intent matched.`);
            }
            if (result.fulfillmentMessages) {
                if (
                    result.fulfillmentMessages[0].platform &&
                    result.fulfillmentMessages[0].platform == 'TELEGRAM' &&
                    result.fulfillmentMessages[0].payload
                ) {
                    responseMessage[0] =
                        result.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.text.stringValue;
                    if (result.fulfillmentMessages[1] && result.fulfillmentMessages[1].text)
                        responseMessage[1] = result.fulfillmentMessages[1].text.text[0];
                } else if (result.fulfillmentMessages[0] && result.fulfillmentMessages[0].text) {
                    responseMessage[0] = result.fulfillmentMessages[0].text.text[0];
                } else {
                    responseMessage[0] =
                        'Sorry, something went wrong. Let me consult an expert and get back to you. Dialogfloe';
                }
            }

            if (responseMessage.length === 0) {
                responseMessage[0] = result.fulfillmentText;
            }
            return this.translateResponse(translate, responseMessage, detected_language);
        } catch (e) {
            return ['Sorry, something went wrong. Let me consult an expert and get back to you!'];
        }

        // console.log("req", responseMessage[0])
    };

    translateResponse(translate, responseMessage, detected_language) {
        try {
            if (detected_language !== 'en') {
                const [translation] = translate.translate(responseMessage[0], {
                    to: detected_language,
                    format: 'text',
                });
                responseMessage = [translation];
            }
            return responseMessage;
        } catch (e) {
            console.log('catch translate', e);
            return responseMessage;
        }
    }
}
