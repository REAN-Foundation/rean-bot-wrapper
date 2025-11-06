import type { clientAuthenticator } from './client.authenticator.interface.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service.js';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class ClickUpAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    get urlToken(): any {
        return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_CLICKUP_CLIENT_URL_TOKEN");
    }

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }

    authenticate(req: any) {
        if (this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
