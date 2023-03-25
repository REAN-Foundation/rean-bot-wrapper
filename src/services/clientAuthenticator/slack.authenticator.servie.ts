import { clientAuthenticator } from './client.authenticator.interface';
import { inject, injectable, Lifecycle, scoped, singleton } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

// @injectable()
@scoped(Lifecycle.ContainerScoped)
export class SlackAuthenticator implements clientAuthenticator{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    get urlToken(): any {
        return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_SLACK_CLIENT_URL_TOKEN");
    }

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    authenticate(req: any, res: any) {
        if (this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');
        
    }
    
}
