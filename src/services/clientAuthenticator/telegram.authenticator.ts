import { clientAuthenticator } from './client.authenticator.interface';
import { injectable, singleton } from 'tsyringe';

@injectable()
@singleton()
export class TelegramAuthenticator implements clientAuthenticator{

    public _urlToken;

    constructor(){
        this._urlToken = process.env.WEBHOOK_TELEGRAM_CLIENT_URL_TOKEN;

    }

    get headerToken(): any {
        throw new Error('Method not implemented.');
    }

    get urlToken(): any {
        return this._urlToken;
    }

    authenticate(req: any) {
        if (this._urlToken === req.params.unique_token){
            return;
        }
        throw new Error('Unable to authenticate.');

    }

}
