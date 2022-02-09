import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';

const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
    ClientEnvironmentProviderService);

export const getHeaders = (accessToken: any) => {
    const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
    const options = getRequestOptions("rean_app");
    options.headers["authorization"] = `Bearer ${accessToken}`;
    options.headers["x-api-key"] = reancare_api_key;
    console.log('reancareAPIkEY for dev services', reancare_api_key);
    console.log('headers in the options', options);
    return options;
};
