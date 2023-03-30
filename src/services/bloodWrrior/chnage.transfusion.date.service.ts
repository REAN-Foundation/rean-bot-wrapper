import { Logger } from '../../common/logger';
import { GetPatientInfoService } from '../support.app.service';
import { NeedleService } from '../needle.service';
import { inject, Lifecycle, scoped } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
export class ChangeTransfusionDateService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService
    ) {}

    async ChangeTransfusionDate(eventObj) {
        try {
            const transfusionDate = eventObj.body.queryResult.parameters.Transfusion_Date;
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    
            const patientUserId = result.message[0].UserId;
            const accessToken = result.message[0].accessToken;
            
            //Update patient health profile
            const apiURL = `patient-health-profiles/${patientUserId}`;
            const obj = {
                BloodTransfusionDate : transfusionDate.split("T")[0],
            };
            await this.needleService.needleRequestForREAN("put", apiURL, accessToken, obj);
    
            const dffMessage = `Date updated Successfully. We will remind you before expected transfusion`;
            return  { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

}
