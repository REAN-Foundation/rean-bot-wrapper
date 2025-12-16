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
        const appClientUrlTokenSetting = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WebhookReanappClientUrlToken");
        return appClientUrlTokenSetting.Value;
    }

    async headerToken(): Promise<any> {
        const appClientHeaderTokenSetting = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WebhookReanappClientHeaderToken");
        return appClientHeaderTokenSetting.Value;
    }

    authenticate(req: any) {
        if (this.headerToken === req.headers.authentication && this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
