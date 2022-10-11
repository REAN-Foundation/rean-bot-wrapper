import { getHeaders } from '../../services/biometrics/get.headers';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import needle from 'needle';
import { Logger } from '../../common/logger';
import { getPhoneNumber } from '../needle.service';

export const registrationService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService
        );
        const name : string = eventObj.body.queryResult.parameters.Name.name;
        const lmp : string = eventObj.body.queryResult.parameters.LMP;

        const phoneNumber = await getPhoneNumber(eventObj);
        
        const options = getHeaders();
        const ReanBackendBaseUrl =
            clientEnvironmentProviderService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
        const url = `${ReanBackendBaseUrl}patients`;

        const resp = await needle('post', url,{ Phone: phoneNumber }, options);
        if (resp.statusCode === 409) {
            const dffMessage = `Hi ${name}, Your phone number already registered with us.`;
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

        } else if (resp.statusCode === 201) {
            Logger.instance().log(`Registration of ${name} with rean care service is complete.`);

        } else {
            throw new Error('Error in patient registration with rean care service.');
        }
        
        const dffMessage = `Hi ${name}, Your Last Mensuration Period(LMP) date is ${new Date(lmp.split("T")[0]).toDateString()}.\nYou will get periodic notifications based on your LMP. Do you agree with this information?`;
        return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

    } else {
        throw new Error(`500, Register patient with maternity careplan error!`);
    }
};

