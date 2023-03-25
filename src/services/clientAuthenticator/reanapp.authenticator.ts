import { clientAuthenticator } from './client.authenticator.interface';
import { inject, injectable, Lifecycle, scoped, singleton } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class ReanAppAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    get urlToken(): any {
        return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_REANAPP_CLIENT_URL_TOKEN");
    }

    get headerToken(): any {
        return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_REANAPP_CLIENT_HEADER_TOKEN");
    }

    authenticate(req: any) {
        if (this.headerToken === req.headers.authentication && this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
