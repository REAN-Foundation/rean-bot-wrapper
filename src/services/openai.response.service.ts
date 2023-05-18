/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
const { Configuration, OpenAIApi } = require("openai");
import { OpenAIResponseFormat } from './response.format/openai.response.format';

@scoped(Lifecycle.ContainerScoped)
export class OpenAIResponseService {

    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService) { }

    getOpenaiMessage = async (message: string) => {
        try {
            const configuration = new Configuration({
                apiKey : this.clientEnvironment.getClientEnvironmentVariable("OPENAI_API_KEY"),
            });
            const openai = new OpenAIApi(configuration);
                  
            const completion = await openai.createChatCompletion({
                model    : "gpt-3.5-turbo",
                messages : [{role: "user", content: message}],
            });
            console.log(completion.data.choices[0].message);
            const response = new OpenAIResponseFormat(completion);
            return response;
        }
        catch (e) {
            console.log(e);
        }

    };

}
