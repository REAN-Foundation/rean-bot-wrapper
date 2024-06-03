import { GetHeaders } from '../biometrics/get.headers';
import { GetPatientInfoService } from '../support.app.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from 'needle';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { isNull } from 'lodash';

@scoped(Lifecycle.ContainerScoped)
export class EnrollPatientService {

    constructor(
        @inject(GetHeaders) private getHeaders?: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(NeedleService) private needleService?: NeedleService
    ){}

    enrollPatientService = async (eventObj, patientUserId = null) => {
        try {
            let result = null;
            if (patientUserId == null) {
                result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
                patientUserId = result.message[0].UserId;
            }
            const options = this.getHeaders.getHeaders();
        
            //Update patient information
            if (!result.message[0].IsRemindersLoaded) {
                const ReanBackendBaseUrl =
                    this.clientEnvironmentProviderService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
        
                const url = `${ReanBackendBaseUrl}care-plans/patients/${patientUserId}/enroll`;
                const obj1 = {
                    Provider  : "REAN_BW",
                    PlanName  : "Patient messages",
                    PlanCode  : "Patient-Reminders",
                    StartDate : new Date().toISOString()
                        .split('T')[0]
                };
        
                const resp = await needle('post', url, obj1, options);
                if (resp.statusCode !== 201) {
                    throw new Error('Failed to get response from ReanCare service API.');
                }
                const enrollmentId = resp.body.Data.Enrollment.id;
                Logger.instance().log(`Enrollment id of user is: ${enrollmentId}`);

                const apiURL = `patients/${patientUserId}`;
                const obj = { "IsRemindersLoaded": true };
                await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
        
                const dffMessage = `Thank you for confirmation. We will remind you before expected blood transfusion date.`;
                return ( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

            } else {
                const dffMessage = `You already have scheduled reminders. Or Change your blood transfusion date then, you will able to load the reminders again.`;
                return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
            }
    
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    };
    
}
