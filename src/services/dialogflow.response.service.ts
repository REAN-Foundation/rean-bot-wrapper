/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
import { v4 } from 'uuid';
import { injectable } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { Imessage } from '../refactor/interface/message.interface';
let dialogflow = require('@google-cloud/dialogflow');
const dialogflowv2 = require('@google-cloud/dialogflow').v2beta1;
const {struct} = require('pb-util');
import { DialogflowResponseFormat } from './response.format/dialogflow.response.format';

@injectable()
export class DialogflowResponseService {

    constructor(private clientEnvironment?: ClientEnvironmentProviderService) { }

    getDialogflowMessage = async (message: string, platform: string = null, intent: string = null, completeMessage:Imessage = null ) => {
        try {

            const env_name = this.clientEnvironment.getClientEnvironmentVariable("NAME");
            if (env_name === "UNION"){
                dialogflow = dialogflowv2;
            }
            const dialogflow_language = "en-US";
            const userId: string = completeMessage.platformId === null ? v4() : completeMessage.platformId;
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
                    payload : struct.encode({source: platform, userId: userId, userName: completeMessage.name,location: location, contextId: completeMessage.contextId, completeMessage: completeMessage})
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
                        payload : struct.encode({source: platform, userId: userId, userName: completeMessage.name,location: location, contextId: completeMessage.contextId, completeMessage: completeMessage })
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
            const dialogflowResponseFormatObj = new DialogflowResponseFormat(responses);
            const intentfromDF = dialogflowResponseFormatObj.getIntent();
            if (intent) {
                console.log(`  Intent: ${intentfromDF}`);
            } else {

                // console.log(`  No intent matched.`);
            }
            return dialogflowResponseFormatObj;
        }
        catch (e) {
            console.log(e);
        }

    };

}
