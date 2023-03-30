import { autoInjectable, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from "../services/set.client/client.environment.provider.service";
import { ResponseHandler } from '../utils/response.handler';

@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class CheckCrossConnection {

    constructor(
        private responseHandler?: ResponseHandler) {}

    checkCrossConnection = (req, res, next): void => {

        // eslint-disable-next-line max-len
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
        const urlParsed = req.url.split('/');
        if (urlParsed.includes("whatsappMeta") && req.method === "POST") {

            const set_phone_number_id = process.env[`${urlParsed[2]}_WHATSAPP_PHONE_NUMBER_ID`];
            if (urlParsed[5] === 'send'){
                console.log("No cross connection",req.url);
                clientEnvironmentProviderService.setClientName(urlParsed[2]);
                console.log("Client name is set to" + urlParsed[2]);
                next();
            } else {
                const phone_number_id_in_request = req.body.entry[0].changes[0].value.metadata.phone_number_id;
                if (phone_number_id_in_request !== set_phone_number_id){
                    this.responseHandler.sendSuccessResponse(res, 200, 'Cross Connection', "");
                    console.log("Cross connection");
                }
                else {
                    console.log("No cross connection");
                    clientEnvironmentProviderService.setClientName(urlParsed[2]);
                    console.log("Client name is set to" + urlParsed[2]);
                    next();
                }
            }
        }
        else {
            if (req.method === "GET"){
                console.log("Reject GET request");
                next();
            } else {
                console.log("No cross connection",req.url);
                clientEnvironmentProviderService.setClientName(urlParsed[2]);
                console.log("Client name is set to" + urlParsed[2]);
                next();
            }
        }
        
    };

}
