import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
export class GetHeaders {

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {}

    getHeaders = (accessToken?: any) => {
        const reancare_api_key = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
        if (!accessToken) {
            accessToken = null;
        }
        const options = getRequestOptions("rean_app");
        options.headers["authorization"] = `Bearer ${accessToken}`;
        options.headers["x-api-key"] = reancare_api_key;
        return options;
    };
    
}
