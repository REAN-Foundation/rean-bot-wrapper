import { clientAuthenticator } from './client.authenticator.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class SlackAuthenticator implements clientAuthenticator{

    constructor(

        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async urlToken(): Promise<any> {
        const slackSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("slack");
        return slackSecrets?.WebhookClientUrlToken;
    }

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async authenticate(req: any, res: any) {
        const urlToken = await this.urlToken();
        if (urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
