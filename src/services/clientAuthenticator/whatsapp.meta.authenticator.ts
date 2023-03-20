import { clientAuthenticator } from './client.authenticator.interface';
import { injectable, singleton } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

@injectable()
@singleton()
export class WhatsappMetaAuthenticator implements clientAuthenticator{

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    get urlToken(): any {
        return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_WHATSAPP_CLIENT_URL_TOKEN");
    }

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }

    authenticate(req: any, res: any) {
        console.log("this.urlToken:" + this.urlToken + " req.params.unique_token:" + req.params.unique_token);
        if (this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');
        
    }
    
}
