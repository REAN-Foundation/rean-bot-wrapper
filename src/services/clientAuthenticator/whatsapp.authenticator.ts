import { clientAuthenticator } from './client.authenticator.interface';
import { injectable, singleton } from 'tsyringe';

@injectable()
@singleton()
export class WhatsappAuthenticator implements clientAuthenticator{
    public _headerToken;
    public _urlToken;
    constructor(){
        this._headerToken = process.env.WEBHOOK_WHATSAPP_CLIENT_HEADER_TOKEN;
        this._urlToken = process.env.WEBHOOK_WHATSAPP_CLIENT_URL_TOKEN;

    }

    get urlToken(): any {
        return this._urlToken;
    }
    get headerToken(): any {
        return this._headerToken;
    }
    
    authenticate(req: any, res: any) {
        if (this._headerToken === req.headers.authentication && this._urlToken === req.params.unique_token){
             return
        }
        throw new Error('Unable to authenticate.');   
        
    }
    
}