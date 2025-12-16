import { Lifecycle, inject, scoped } from "tsyringe";
import XLSX = require('xlsx');
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import dialogflow = require('@google-cloud/dialogflow');
import { Iresponse } from "../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";

@scoped(Lifecycle.ContainerScoped)
export class demoBotService {

    private _platformMessageService : platformServiceInterface = null;

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService) { }

    async readExcel(path){
        try {
            var workbook = XLSX.readFile(path);
            var sheet_name_list = workbook.SheetNames;
            console.log("Here in trying to read the excel");
            var total_data = [];

            for (let y = 0; y < sheet_name_list.length; y++) {
                var data = [];
                const sheet_name = sheet_name_list[y];
                var worksheet = workbook.Sheets[sheet_name];
                var headers = {};
                headers['Category'] = 'Category';
                for (const z in worksheet ) {
                    if (z[0] === '!') continue;

                    var col = z.substring(0,1);
                    var row = parseInt(z.substring(1));
                    var value = worksheet[z].v;

                    if (row === 1) {
                        headers[col] = value;
                        continue;
                    }

                    if (!data[row]) data[row] = {};
                    data[row][headers[col]] = value;
                    data[row][headers['Category']] = sheet_name;
                }

                data.shift();
                data.shift();
                total_data.push(data);
            }
            return total_data;
        } catch (error) {
            console.log(error);
            console.log('Error reading excel file');
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createIntent(excelData, userSessionId){
        console.log('Creating intents');
        const dfBotGcpSettings = await this.clientEnvironment.getClientEnvironmentVariable("DialogflowSettings");
        const dfBotGCPCredentials = dfBotGcpSettings.Value.DialogflowBotGcpProjectCredentials;
        const GCPCredentials = await this.clientEnvironment.getClientEnvironmentVariable("GoogleApplicationCredentials");
        // const GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const dialogflowApplicationCredentialsobj = dfBotGCPCredentials ? dfBotGCPCredentials : GCPCredentials;
        const options = {
            credentials : {
                client_email : dialogflowApplicationCredentialsobj.client_email,
                private_key  : dialogflowApplicationCredentialsobj.private_key,
            },
            projectId : dfBotGcpSettings.Value.ProjectId,
        };
        const projectIdFinal = dfBotGcpSettings.Value.ProjectId;

        const intentsClient = new dialogflow.IntentsClient(options);
        const projectAgentPath = intentsClient.projectAgentPath(projectIdFinal);
        const request = {
            parent : projectAgentPath,
        };
        const intent_list = await intentsClient.listIntents(request);

        const intents = [];
        for (const filter_intent of intent_list[0]){
            if (filter_intent.displayName.match(/FAQ.*/) ) {
                const intentPath = intentsClient.projectAgentIntentPath(projectIdFinal,filter_intent.name.split('/').pop());
                const delete_request = { name: intentPath };
                intents.push(delete_request);

            }
        }

        if (intents.length !== 0) {
            await intentsClient.batchDeleteIntents({ parent: projectAgentPath, intents: intents });
        }

        // Create the intents in the dialogflow
        for (const excelSheet of excelData){
            var count = 0;
            for (const messages of excelSheet){
                count++;

                const trainingPhrases = [];

                const df_resp = messages.Response;
                const category = messages.Category;
                delete messages.Response;
                for (const phrase in messages) {

                    const part = {
                        text : messages[phrase]
                    };

                    const trainingPhrase = {
                        type  : 'EXAMPLE',
                        parts : [part],
                    };

                    trainingPhrases.push(trainingPhrase);
                }

                const messageText = {
                    text : [df_resp],
                };

                const message = {
                    text : messageText,
                };

                const displayName = `${category}_FAQ_${count}`;

                const intent = {
                    displayName     : displayName,
                    trainingPhrases : trainingPhrases,
                    messages        : [message]
                };

                const createIntentRequest = {
                    parent : projectAgentPath,
                    intent : intent,
                };

                await this.sleep(2500);
                const [response] = await intentsClient.createIntent(createIntentRequest);
                console.log(`Intent - ${displayName} - ${response.name} created`);
            }
        }

        console.log("All intents created");
        return true;

    }

    async postResponseDemo(eventObj, sessionId: any, client: any, data:any) {
        console.log("Sending demo bot success message");
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = client;
        response_format.sessionId = sessionId;
        response_format.messageText = data;
        response_format.message_type = "text";

        this._platformMessageService = eventObj.container.resolve(client);
        await this._platformMessageService.SendMediaMessage(response_format,null);
    }

    async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

}
