import { getRequestOptions } from '../../utils/helper';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';

const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
    ClientEnvironmentProviderService);

export const getHeaders = (accessToken: any) => {
    const reancare_api_key = clientEnvironmentProviderService.getClientEnvironmentVariable("ReancareApiKey");
    const options = getRequestOptions("rean_app");
    options.headers["authorization"] = `Bearer ${accessToken}`;
    options.headers["x-api-key"] = `${reancare_api_key}`;
    console.log(`exiting from headers `, options);
    return options;
};
