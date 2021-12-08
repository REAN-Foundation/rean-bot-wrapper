import { injectable, singleton } from 'tsyringe';

@injectable()
@singleton()
export class ClientEnvironmentProviderService {
    private clientName;
    
    setClientName(clientName){
        this.clientName = clientName;
    }
    
    getClientName(){
        if (!this.clientName){
            throw new Error("No client name provided");  
        }
        return this.clientName 
    }

    getClientEnvironmentVariable(variablename){
        // console.log("getClientEnvironmentVariable",[this.clientName + "_" + variablename])
        return process.env[this.clientName + "_" + variablename]
    }

    clientNameMiddleware = (req, res, next) => {
        // console.log('params in middleware ',req.params);
        if (req.params.client){
            this.setClientName(req.params.client)
        }
        next();
      }
}