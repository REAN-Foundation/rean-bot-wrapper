import { clientAuthenticator } from './client.authenticator.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class WatiWhatsappAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async urlToken(): Promise<any> {
        const watiSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("wati");
        return watiSecrets.WebhookClientUrlToken;
        //
        //
        //return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_WATI_CLIENT_URL_TOKEN");
    }

    get headerToken(): any {
        throw new Error("Method not required for Wati");
    }

    authenticate(req: any) {
        if (this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}