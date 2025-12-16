import { Lifecycle, scoped, inject } from "tsyringe";
import dialogflow = require('@google-cloud/dialogflow');
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import { AwsS3manager } from "../aws.file.upload.service";

@scoped(Lifecycle.ContainerScoped)
export class DFBackup {

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awss3manager?: AwsS3manager
    ){}

    async createDFBackup(clientName) {
        const [intent_list, project_id] = await this.getIntents();
        const intents = [];

        for (const intent of intent_list[0]) {
            intents.push(JSON.stringify(intent));
        }

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        const date = mm + '-' + dd + '-' + yyyy;
        const fileName = date + "_" + project_id;
        const key = `${clientName}/df_backups/data/${fileName}.json`;
        await this.awss3manager.uploadKoboData(key,intents);
    }

    async getIntents() {
        const dfSettings = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DialogflowBotGcpProjectCredentials");
        const dfBotGCPCredentials = dfSettings ? JSON.parse(dfSettings.Value) : null;
        const GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const dialogflowApplicationCredentialsobj = dfBotGCPCredentials ? dfBotGCPCredentials : GCPCredentials;
        const options = {
            credentials : {
                client_email : dialogflowApplicationCredentialsobj.client_email,
                private_key  : dialogflowApplicationCredentialsobj.private_key,
            },
            projectId : dialogflowApplicationCredentialsobj.project_id
        };
        const projectIdFinal = dialogflowApplicationCredentialsobj.project_id;

        const intentsClient = new dialogflow.IntentsClient(options);
        const projectAgentPath = intentsClient.projectAgentPath(projectIdFinal);
        const request = {
            parent : projectAgentPath,
        };
        const intent_list = await intentsClient.listIntents(request);
        return [intent_list, projectIdFinal];
    }

}