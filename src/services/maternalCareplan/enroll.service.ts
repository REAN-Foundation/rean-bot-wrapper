import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from '../../services/support.app.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import needle from 'needle';

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const enrollService = async (eventObj) => {
    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService
        );
        const name = eventObj.body.queryResult.parameters.Name.name;
        const lmp = eventObj.body.queryResult.parameters.LMP;
        const birthdate : string = eventObj.body.queryResult.parameters.Birthdate;

        const date_1 = new Date(lmp.split("T")[0]);
        const date_2 = new Date();

        const days = (date_1: Date, date_2: Date) =>{
            const difference = date_2.getTime() - date_1.getTime();
            const TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
            return TotalDays;
        };

        let result = null;
        result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

        const patientUserId = result.message[0].UserId;
        const accessToken = result.message[0].accessToken;
        const options = getHeaders(accessToken);

        //Update patient information
        const ReanBackendBaseUrl =
            clientEnvironmentProviderService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
        let url = `${ReanBackendBaseUrl}patients/${patientUserId}`;
        const obj = {
            FirstName : name.split(" ")[0],
            LastName  : name.split(" ")[1],
            Gender    : "Female",
            BirthDate : birthdate.split("T")[0]
        };
        const resp1 = await needle('put', url, obj, options);
        if (resp1.statusCode !== 200) {
            throw new Error('Failed to get response from ReanCare service API.');
        }

        url = `${ReanBackendBaseUrl}care-plans/patients/${patientUserId}/enroll`;
        const obj1 = {
            Provider  : "REAN",
            PlanName  : "Maternity Careplan",
            PlanCode  : "DMC-Maternity",
            StartDate : new Date().toISOString().split('T')[0],
            DayOffset : (days(date_1, date_2) - 28)
        };

        const resp = await needle('post', url, obj1, options);
        if (resp.statusCode !== 201) {
            throw new Error('Failed to get response from ReanCare service API.');
        }
        const enrollmentId = resp.body.Data.Enrollment.EnrollmentId;
        Logger.instance().log(`Enrollment id of user is: ${enrollmentId}`);

        const dffMessage = `Welcome! ${name}, you have successfully subscribed to the REAN Maternal care plan.`;

        return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
    } else {
        throw new Error(`500, Maternity careplan enrollment service error!`);
    }
};

