import { RequestResponseCacheService } from '../../modules/cache/request.response.cache.service';
import { scoped, Lifecycle } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
export class ClientEnvironmentProviderService {

    private clientName;

    constructor() {
        console.log("***ClientEnvironmentProviderService*** instance is created by DI container");
    }

    setClientName(clientName){
        this.clientName = clientName;
    }

    getClientName(){
        if (!this.clientName){
            throw new Error("No client name provided");
        }
        return this.clientName;
    }

    async getClientEnvironmentVariable(variablename){

        // console.log("getClientEnvironmentVariable",[this.clientName + "_" + variablename]);
        const key = `bot-secrets-${this.clientName}`;
        const clientVariables = await RequestResponseCacheService.get(key, "persistent");
        if (clientVariables && clientVariables[variablename]){
            const value = clientVariables[variablename];
            if (value === undefined) {
                return undefined;
            }
            return clientVariables[variablename];
        }
        return undefined;
    }

    private normalizeCachedValue(value: any): any {
        if (typeof value !== 'string') {
            return value;
        }
        const trimmed = value.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    }

    clientNameMiddleware = (req, res, next) => {

        // console.log('params in middleware ',req.params);
        if (req.params.client) {
            this.setClientName(req.params.client);
            next();
        } else if (req.url.split('/')[2] !== "") {
            this.setClientName(req.url.split('/')[2]);
            next();
        } else {
            console.log('No client name provided');
            res.status(400).send('No client name provided');
        }
    };

}
