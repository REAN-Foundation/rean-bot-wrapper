import { getHeaders } from '../../services/biometrics/get.headers';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import needle from 'needle';
import { Logger } from '../../common/logger';

export const registrationService = async (eventObj) => {

    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService
        );
        const name : string = eventObj.body.queryResult.parameters.Name.name;
        const lmp : string = eventObj.body.queryResult.parameters.LMP;

        const date_1 = new Date(lmp.split("T")[0]);
        const date_2 = new Date();

        const days = (date_1: Date, date_2: Date) =>{
            const difference = date_2.getTime() - date_1.getTime();
            const TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
            return TotalDays;
        };
        if (days(date_1, date_2) < 28) {
            const dffMessage = `Hello ${name}, Please try to register again after the 4th week of your pregnancy.`;
            Logger.instance().log(`Patient not elligible to take maternity careplan.`);
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
        }

        const b = eventObj.body.session;
        let phoneNumber = b.split("/", 5)[4];
        if (!phoneNumber) {
            throw new Error('Missing required parameter PhoneNumber!');
        }
        if (phoneNumber.length > 10 && phoneNumber.indexOf('+') === -1) {
            phoneNumber = '+' + phoneNumber;
        }

        // adding "-" if phone number does not contain one.
        const ten_digit = phoneNumber.substr(phoneNumber.length - 10);
        const country_code = phoneNumber.split(ten_digit)[0];
        if (phoneNumber.length > 10 && phoneNumber.indexOf('-') === -1) {
            phoneNumber = `${country_code}-${ten_digit}`;
        }
        
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
        const date = new Date(lmp.split("T")[0]).toDateString();
        
        const dffMessage = `Hi ${name}, Your last mensuration period date is ${date}. Do you agree on this information?`;
        return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

    } else {
        throw new Error(`500, Register patient with maternity careplan error!`);
    }
};

