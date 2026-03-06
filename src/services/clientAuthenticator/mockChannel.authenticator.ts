import { clientAuthenticator } from './client.authenticator.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class MockChannelAuthenticator implements clientAuthenticator {

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {}

    async apiKey(): Promise<string> {
        return await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_MOCK_CHANNEL_CLIENT_API_KEY");
    }

    async authenticate(req: any) {
        const requestApiKey = req.headers['x-api-key'];
        const apiKey = await this.apiKey();
        if (requestApiKey && requestApiKey === apiKey) {
            return;
        }
        throw new Error('Unable to authenticate. Invalid or missing x-api-key.');
    }

    get urlToken(): any {
        throw new Error('Deprecated. Use x-api-key header instead.');
    }

    get headerToken(): any {
        throw new Error('Deprecated. Use x-api-key header instead.');
    }
}


// import { clientAuthenticator } from './client.authenticator.interface';
// import { inject, Lifecycle, scoped } from 'tsyringe';
// import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// // @injectable()
// @scoped(Lifecycle.ContainerScoped)
// export class MockChannelAuthenticator implements clientAuthenticator{

//     constructor(
//         // eslint-disable-next-line max-len
//         @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
//     ){}

//     get urlToken(): any {
//         return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_MOCK_CHANNEL_CLIENT_URL_TOKEN");
//     }

//     get headerToken(): any {
//         throw new Error('Method not implemented.');
//     }

//     authenticate(req: any) {
//         if (this.urlToken === req.params.unique_token){
//             return;
//         }
//         throw new Error('Unable to authenticate.');

//     }

// }
