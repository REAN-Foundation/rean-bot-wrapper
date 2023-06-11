import { GetHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from '../../services/support.app.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import needle from 'needle';

@scoped(Lifecycle.ContainerScoped)
export class EnrollService {

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    async enrollService (eventObj) {
        return new Promise(async (resolve) => {
            try {
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
                result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    
                const patientUserId = result.message[0].UserId;
                const accessToken = result.message[0].accessToken;
                const options = this.getHeaders.getHeaders(accessToken);

                // const enrollmentUrl = `${ReanBackendBaseUrl}care-plans/patients/${patientUserId}/enroll`;
                // const obj1 = {
                //     Provider  : "REAN",
                //     PlanName  : "Maternity Careplan",
                //     PlanCode  : "DMC-Maternity",
                //     StartDate : new Date().toISOString()
                //         .split('T')[0],
                //     DayOffset : (days(date_1, date_2) - 28)
                // };
                // const resp = await this.needleService.needleRequestForREAN("post", enrollmentUrl, null, obj1);
    
                // // const resp = await needle('post', enrollmentUrl, obj1, options);
                // // if (resp.statusCode !== 201) {
                // //     throw new Error('Failed to get response from ReanCare service API.');
                // // }

                // const enrollmentId = resp.Data.Enrollment.EnrollmentId;
                // Logger.instance().log(`Enrollment id of user is: ${enrollmentId}`);
    
                // const dffMessage = `Welcome! ${name}, you have successfully subscribed to the REAN Maternal care plan.`;
                // const response_format: Iresponse = commonResponseMessageFormat();

                // const payload = eventObj.body.originalDetectIntentRequest.payload;
                // this._platformMessageService = eventObj.container.resolve(payload.source);
                // const b = eventObj.body.session;
                // const patientPhoneNumber = b.split("/", 5)[4];
                // response_format.platform = payload.source;
                // response_format.sessionId = patientPhoneNumber;
                // response_format.messageText = dffMessage;
                // response_format.message_type = "text";
                // await this._platformMessageService.SendMediaMessage(response_format, null);
    
                const dffMessage = `Welcome! ${name}, you have successfully subscribed to the REAN Maternal care plan.`;
    
                resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });
        
            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'accept blood donation request with patient service error');
            }
        });
    }
    
}
