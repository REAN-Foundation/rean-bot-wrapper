import { autoInjectable, container, singleton, Lifecycle, scoped } from "tsyringe";
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
            const phone_number_id_in_request = req.body.entry[0].changes[0].value.metadata.phone_number_id;
            console.log("phone_number_id_in_request:" + phone_number_id_in_request + " type is: " + typeof(phone_number_id_in_request));
            console.log("set_phone_number_id:" + set_phone_number_id + " type is: " + typeof(set_phone_number_id));
            if (phone_number_id_in_request !== set_phone_number_id){
                this.responseHandler.sendSuccessResponse(res, 200, 'Cross Connection', "");
                console.log("Cross connection");
            }
            else {
                console.log("No cross connection");
                clientEnvironmentProviderService.setClientName(urlParsed[2]);
                console.log("Client name is set to" + urlParsed[2]);
                // const interval = setInterval(function() {
                //     console.log("Current Client name is:" + clientEnvironmentProviderService.getClientName());
                //     console.log("Original Client Name was :" + urlParsed[2]);
                // }, 2000);
                // setTimeout(function() {
                //     clearInterval(interval);
                // }, 500000);
                next();
            }
        }
        else {
            console.log("No cross connection",req.url);
            clientEnvironmentProviderService.setClientName(urlParsed[2]);
            console.log("Client name is set to" + urlParsed[2]);
            next();
        }
    };

}
