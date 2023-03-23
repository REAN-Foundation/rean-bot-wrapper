import { autoInjectable, container } from "tsyringe";
import { ClientEnvironmentProviderService } from "../services/set.client/client.environment.provider.service";
import { ResponseHandler } from '../utils/response.handler';

@autoInjectable()
export class CheckCrossConnection {

    constructor(
        private responseHandler?: ResponseHandler) {}

    checkCrossConnection = (req, res, next): void => {

        // eslint-disable-next-line max-len
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
        const set_phone_number_id = clientEnvironmentProviderService.getClientEnvironmentVariable('WHATSAPP_PHONE_NUMBER_ID');
        const urlParsed = req.url.split('/');
        if (urlParsed.includes("whatsappMeta")) {
            const phone_number_id_in_request = req.body.entry[0].changes[0].value.metadata.phone_number_id;
            console.log("phone_number_id_in_request:" + phone_number_id_in_request + " type is: " + typeof(phone_number_id_in_request));
            console.log("set_phone_number_id:" + set_phone_number_id + " type is: " + typeof(set_phone_number_id));
            if (phone_number_id_in_request !== set_phone_number_id){
                this.responseHandler.sendSuccessResponse(res, 200, 'Cross Connection', "");
                console.log("Cross connection");
            }
            else {
                console.log("No cross connection");
                next();
            }
        }
        else {
            console.log("No cross connection",req.url);
            next();
        }
    };

}
