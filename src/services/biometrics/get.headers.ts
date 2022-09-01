import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';

export const getHeaders = (accessToken?: any) => {
    const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
        ClientEnvironmentProviderService);
    const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
    if (!accessToken) {
        accessToken = null;
    }
    const options = getRequestOptions("rean_app");
    options.headers["authorization"] = `Bearer ${accessToken}`;
    options.headers["x-api-key"] = reancare_api_key;
    return options;
};
