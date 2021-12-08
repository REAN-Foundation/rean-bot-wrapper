import { clientAuthenticator } from './client.authenticator.interface';
import { injectable, singleton } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';

@injectable()
@singleton()
export class TelegramAuthenticator implements clientAuthenticator{

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }

    get urlToken(): any {
        return this.clientEnvironmentProviderService.getClientEnvironmentVariable("WEBHOOK_TELEGRAM_CLIENT_URL_TOKEN");
    }

    authenticate(req: any) {
        if (this.urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
