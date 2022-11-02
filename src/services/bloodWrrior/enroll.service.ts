import { getHeaders } from '../biometrics/get.headers';
import { GetPatientInfoService } from '../support.app.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import needle from 'needle';
import { Logger } from '../../common/logger';

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const enrollPatientService = async (eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
                ClientEnvironmentProviderService
            );
            let result = null;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    
            const patientUserId = result.message[0].UserId;
            const accessToken = result.message[0].accessToken;
            const options = getHeaders(accessToken);
    
            //Update patient information
            const ReanBackendBaseUrl =
                clientEnvironmentProviderService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
    
            const url = `${ReanBackendBaseUrl}care-plans/patients/${patientUserId}/enroll`;
            const obj1 = {
                Provider  : "REAN_BW",
                PlanName  : "Patient messages",
                PlanCode  : "Patient-Reminders",
                StartDate : new Date().toISOString().split('T')[0]
            };
    
            const resp = await needle('post', url, obj1, options);
            if (resp.statusCode !== 201) {
                throw new Error('Failed to get response from ReanCare service API.');
            }
            const enrollmentId = resp.body.Data.Enrollment.EnrollmentId;
            Logger.instance().log(`Enrollment id of user is: ${enrollmentId}`);
    
            const dffMessage = `Thank you for confirmation. We will remind you before expected blood transfusion date.`;
            resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    });
};
