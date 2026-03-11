import { clientAuthenticator } from './client.authenticator.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class ReanAppAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async urlToken(): Promise<any> {
        const appClientUrlToken = process.env.WEBHOOK_REANAPP_CLIENT_URL_TOKEN;
        return appClientUrlToken;
    }

    async headerToken(): Promise<any> {
        const appClientHeaderToken = process.env.WEBHOOK_REANAPP_CLIENT_HEADER_TOKEN;
        return appClientHeaderToken;
    }

    async authenticate(req: any) {
        const urlToken = await this.urlToken();
        const headerToken = await this.headerToken();
        if (headerToken === req.headers.authentication && urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
