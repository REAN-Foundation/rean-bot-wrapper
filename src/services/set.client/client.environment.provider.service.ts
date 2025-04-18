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

    getClientEnvironmentVariable(variablename){

        // console.log("getClientEnvironmentVariable",[this.clientName + "_" + variablename]);
        return process.env[this.clientName + "_" + variablename];
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
