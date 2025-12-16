import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
export class GetHeaders {

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {}

    getHeaders = (accessToken?: any, api_key = process.env.REANCARE_API_KEY) => {
        const reancare_api_key = api_key;
        if (!accessToken) {
            accessToken = null;
        }
        const options = getRequestOptions("rean_app");
        options.headers["authorization"] = `Bearer ${accessToken}`;
        options.headers["x-api-key"] = reancare_api_key;
        return options;
    };

    getWorkflowHeaders = async(accessToken?: any) => {
        const workflowApiKey = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WorkflowApiKey");
        const workflow_api_key = workflowApiKey.Value;
        if (!accessToken) {
            accessToken = null;
        }
        const options = {
            headers : {
                "Content-Type"  : 'application/json',
                "Authorization" : `Bearer ${accessToken}`,
                "x-api-key"     : workflow_api_key
            }
        };

        return options;
    };

}
