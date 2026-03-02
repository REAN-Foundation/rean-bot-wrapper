import { clientAuthenticator } from './client.authenticator.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class TelegramAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }

    async urlToken(): Promise<any> {
        const telegramSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("telegram");
        return telegramSecrets?.WebhookClientUrlToken;

    }

    async authenticate(req: any) {
        console.log(this.clientEnvironmentProviderService.getClientName());
        const urlToken = await this.urlToken();
        console.log("urlToken:" + urlToken + " req.params.unique_token:" + req.params.unique_token);
        if (urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
