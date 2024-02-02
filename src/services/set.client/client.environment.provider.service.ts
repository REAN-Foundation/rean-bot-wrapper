import { scoped, Lifecycle, inject, injectable } from 'tsyringe';
import { EnvVariableCache } from '../cache/env.variable.cache';

@scoped(Lifecycle.ContainerScoped)

export class ClientEnvironmentProviderService {

    private _tenantName = null;

    private _useCache = process.env.USE_ENV_CACHE === 'true' ? true : false;

    // constructor(@inject("TenantName") tenantName?: string) {
    //     if (tenantName) {
    //         this._tenantName = tenantName;
    //     }
    // }
    
    setClientName(clientName){
        this._tenantName = clientName;
    }
    
    getClientName(){
        if (!this._tenantName){
            throw new Error("No client name provided");
        }
        return this._tenantName;
    }

    // getClientEnvironmentVariable(variablename){

    //     // console.log("getClientEnvironmentVariable",[this.clientName + "_" + variablename]);
    //     return process.env[this.clientName + "_" + variablename];
    // }

    getClientEnvironmentVariable = (variableName) => {
        if (this._useCache){
            const envVariable = EnvVariableCache.get(this._tenantName, variableName);
            if (envVariable) {
                return envVariable;
            }
            throw new Error("No environment variable found for " + variableName);
        }
        else {
            const envVariable = process.env[this._tenantName + "_" + variableName];
            if (envVariable) {
                return process.env[envVariable];
            }
            throw new Error("No environment variable found for " + variableName);
        }
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
