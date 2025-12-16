import { clientAuthenticator } from './client.authenticator.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class WhatsappAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async urlToken(): Promise<any> {
        const whatsappSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("whatsapp");
        return whatsappSecrets.WebhookClientUrlToken;
        //
        //
        //return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_WHATSAPP_CLIENT_URL_TOKEN");

    }

    async headerToken(): Promise<any> {
        const whatsappSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("whatsapp");
        return whatsappSecrets.WebhookClientHeaderToken;
        //return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_WHATSAPP_CLIENT_HEADER_TOKEN");
    }

    authenticate(req: any) {
        if (this.headerToken === req.headers.authentication && this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
