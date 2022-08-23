import { autoInjectable,container } from "tsyringe";
import XLSX = require('xlsx');
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import dialogflow = require('@google-cloud/dialogflow');

@autoInjectable()
export class demoBotService {

    private _platformMessageService?: platformServiceInterface;

    constructor(private clientEnvironment?: ClientEnvironmentProviderService) {}

    async readExcel(path){
        try {
            var workbook = XLSX.readFile(path);
            var sheet_name_list = workbook.SheetNames;
            console.log("Here in trying to read the excel");

            var data = [];

            for (let y=0; y < sheet_name_list.length; y++) {
                const sheet_name = sheet_name_list[y];
                var worksheet = workbook.Sheets[sheet_name];
                var headers = {};

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
                }

                data.shift();
                data.shift();
            }
            return data;
        } catch (error) {
            console.log(error);
            console.log('Error reading excel file');
        }
    }

    async createIntent(excelData, userSessionId){
        console.log('Creating intents');
        const dfBotGCPCredentials = JSON.parse(this.clientEnvironment.getClientEnvironmentVariable("DIALOGFLOW_BOT_GCP_PROJECT_CREDENTIALS"));
        const GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const dialogflowApplicationCredentialsobj = dfBotGCPCredentials ? dfBotGCPCredentials : GCPCredentials;
        const options = {
            credentials : {
                client_email : dialogflowApplicationCredentialsobj.client_email,
                private_key  : dialogflowApplicationCredentialsobj.private_key,
            },
            projectId : this.clientEnvironment.getClientEnvironmentVariable('DIALOGFLOW_PROJECT_ID')
        };
        const projectIdFinal = this.clientEnvironment.getClientEnvironmentVariable('DIALOGFLOW_PROJECT_ID');

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
                const delete_request = {name: intentPath};
                intents.push(delete_request);

            }
        }
        
        const delete_request = await intentsClient.batchDeleteIntents({parent: projectAgentPath, intents: intents});

        var count = 0;

        // Create the intents in the dialogflow
        for (const messages of excelData){
            count++;

            const trainingPhrases = [];
            const part = {
                text : messages.Intent
            };

            const trainingPhrase = {
                type  : 'EXAMPLE',
                parts : [part],
            };

            trainingPhrases.push(trainingPhrase);

            const messageText = {
                text : [messages.Response],
            };

            const message = {
                text : messageText,
            };

            const displayName = `FAQ_${count}`;

            const intent = {
                displayName     : displayName,
                trainingPhrases : trainingPhrases,
                messages        : [message]
            };

            const createIntentRequest = {
                parent : projectAgentPath,
                intent : intent,
            };

            const [response] = await intentsClient.createIntent(createIntentRequest);
            console.log(`Intent ${response.name} created`);
        }
        
        return true;

    }

    async postResponseDemo(sessionId: any, client: any, data:any) {
        console.log("Sending demo bot success message");
        this._platformMessageService = container.resolve(client);
        await this._platformMessageService.SendMediaMessage(sessionId,null,data,'text',null);
    }
}