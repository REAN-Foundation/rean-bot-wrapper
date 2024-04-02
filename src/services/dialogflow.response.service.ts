/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
import { v4 } from 'uuid';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { Imessage } from '../refactor/interface/message.interface';
let dialogflow = require('@google-cloud/dialogflow');
const dialogflowv2 = require('@google-cloud/dialogflow').v2beta1;
const { struct } = require('pb-util');
import { DialogflowResponseFormat } from './response.format/dialogflow.response.format';
import { NeedleService } from './needle.service';
import { GetPatientInfoService } from './support.app.service';
import { TimeHelper } from '../common/time.helper';

@scoped(Lifecycle.ContainerScoped)
export class DialogflowResponseService {

    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
                @inject(NeedleService) private needleService?: NeedleService,
                @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,) { }

    async getDialogflowLanguage(){
        if (this.clientEnvironment.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE")){
            return this.clientEnvironment.getClientEnvironmentVariable("DIALOGFLOW_DEFAULT_LANGUAGE_CODE");
        }
        else {
            return "en-US";
        }

    }

    getDialogflowMessage = async (message: string, platform: string = null, intent: string = null, completeMessage:Imessage = null ) => {
        try {
            
            const env_name = this.clientEnvironment.getClientEnvironmentVariable("NAME");
            if (env_name === "UNION"){
                dialogflow = dialogflowv2;
            }
            const dialogflow_language = await this.getDialogflowLanguage();
            
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

            const timeZoneOffset = await this.getUserTimeZoneOffset(completeMessage);
            const timezoneName = TimeHelper.getUserTimeZone(timeZoneOffset);
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
                    payload  : struct.encode({ source: platform, userId: userId, userName: completeMessage.name,location: location, contextId: completeMessage.contextId, completeMessage: completeMessage }),
                    timeZone : timezoneName
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
                        payload  : struct.encode({ source: platform, userId: userId, userName: completeMessage.name,location: location, contextId: completeMessage.contextId, completeMessage: completeMessage }),
                        timeZone : timezoneName
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
            await dialogflowResponseFormatObj.updateConfidenceScore(completeMessage.platformId);
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

    async getUserTimeZoneOffset(completeMessage:Imessage){
        let patientUserId = null;
        let result = null;
        if (completeMessage.platform === "telegram" || completeMessage.platform === "Telegram") {
            const apiURL = `patients/search?userName=${completeMessage.platformId}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);

        } else if (completeMessage.platform === "whatsappMeta" || completeMessage.platform === "whatsapp") {
            const apiURL = `patients/byPhone?phone=${encodeURIComponent(this.getPatientInfoService.convertPhoneNumber(completeMessage.platformId))}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
        }
        else{

            //handle if any other plateform
        }
        
        if (result.Data) {
            if (result.Data.Patients.Items.length === 0) {
                return null;
            } else {
                patientUserId = result.Data.Patients.Items[0].UserId;
            }
        }
        if (patientUserId !== null) {
            const getPatientUrl = `patients/${patientUserId}`;
            const res = await this.needleService.needleRequestForREAN('get', getPatientUrl);
            const userTimeZone = res.Data.Patient.User.CurrentTimeZone;
            return userTimeZone;
        }
        return null;
    }

}
