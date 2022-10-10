/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
import { v4 } from 'uuid';
import { injectable } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { Imessage } from '../refactor/interface/message.interface';
let dialogflow = require('@google-cloud/dialogflow');
const dialogflowv2 = require('@google-cloud/dialogflow').v2beta1;
const {struct} = require('pb-util');

@injectable()
export class DialogflowResponseService {

    constructor(private clientEnvironment?: ClientEnvironmentProviderService) { }

    getDialogflowMessage = async (message: string, userPlatformId: string = null, platform: string = null, userName: string, intent: string = null, completeMessage:Imessage =null ) => {
        try {

            const env_name = this.clientEnvironment.getClientEnvironmentVariable("NAME");
            if (env_name === "UNION"){
                dialogflow = dialogflowv2;
            }

            // set default values
            let responseMessage = { text: [], parse_mode: false, image: { url: '', caption: '' } };
            const dialogflow_language = "en-US";
            const userId: string = userPlatformId === null ? v4() : userPlatformId;
            const location = completeMessage.latlong === null ? v4() : completeMessage.latlong;

            let sessionClient = null;
            let sessionPath = null;
            let options = {};
            let projectIdFinal = null;

            if (platform === "REAN_SUPPORT") {
                const ReanAppGcpCredentials = JSON.parse(this.clientEnvironment.getClientEnvironmentVariable("REAN_APP_SUPPORT_GCP_PROJ_CREDENTIALS"));
                options = {
                    credentials : {
                        client_email : ReanAppGcpCredentials.client_email,
                        private_key  : ReanAppGcpCredentials.private_key
                    },
                    projectId : ReanAppGcpCredentials.private_key
                };
                projectIdFinal = this.clientEnvironment.getClientEnvironmentVariable("DIALOGFLOW_PROJECT_ID_REAN_APP");

            } else {
                console.log("Entered the else of Dialogflow..............");
                const dfBotGCPCredentials = JSON.parse(this.clientEnvironment.getClientEnvironmentVariable("DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS"));
                const GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
                const dialogflowApplicationCredentialsobj = dfBotGCPCredentials ? dfBotGCPCredentials : GCPCredentials;
                options = {
                    credentials : {
                        client_email : dialogflowApplicationCredentialsobj.client_email,
                        private_key  : dialogflowApplicationCredentialsobj.private_key
                    },
                    projectId : dialogflowApplicationCredentialsobj.private_key
                };
                projectIdFinal = this.clientEnvironment.getClientEnvironmentVariable("DIALOGFLOW_PROJECT_ID");

            }
            sessionClient = new dialogflow.SessionsClient(options);
            sessionPath = sessionClient.projectAgentSessionPath(projectIdFinal, userId);
            console.log("Message to be sent to DF: ", message);
            const request = {
                session    : sessionPath,
                queryInput : {
                    text : {
                        text         : message,
                        languageCode : dialogflow_language,
                    },
                },
                queryParams : {
                    payload : struct.encode({source: platform, userId: userId, userName: userName,location: location})
                },
            };
            let request_intent = null;
            if (intent !== null){
                request_intent = {
                    session    : sessionPath,
                    queryInput : {
                        event : {
                            name         : intent,
                            languageCode : dialogflow_language,
                        },
                    },
                    queryParams : {
                        payload : struct.encode({source: platform, userId: userId, userName: userName,location: location })
                    },
                };
            }
            console.log("B$session CLient detects intent");
            let responses = null;
            if (request_intent !== null){
                responses = await sessionClient.detectIntent(request_intent);
            } else {
                responses = await sessionClient.detectIntent(request);
            }
            const result = responses[0].queryResult;
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
            } else {

                // console.log(`  No intent matched.`);
            }

            responseMessage = getFulfillmentResponse(result);
            if (responseMessage.text.length === 0) {
                responseMessage.text[0] = result.fulfillmentText;
            }
            const dfResponseObj = {
                text  : responseMessage.text,
                image : responseMessage.image ? responseMessage.image : {
                    url     : "",
                    caption : ""
                },
                parse_mode : responseMessage.parse_mode ? responseMessage.parse_mode : false,
                result     : result,
            };
            return dfResponseObj;
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

    };

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
