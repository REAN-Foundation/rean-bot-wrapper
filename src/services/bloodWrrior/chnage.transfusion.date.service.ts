import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { GetPatientInfoService } from '../support.app.service';
import { needleRequestForREAN } from '../needle.service';

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const changeTransfusionDateService = async (eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            const transfusionDate = eventObj.body.queryResult.parameters.Transfusion_Date;
            let result = null;
            result = await getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
    
            const patientUserId = result.message[0].UserId;
            const accessToken = result.message[0].accessToken;
           
            //Update patient health profile
            const apiURL = `patient-health-profiles/${patientUserId}`;
            const obj = {
                BloodTransfusionDate : transfusionDate.split("T")[0],
            };
            const requestBody = await needleRequestForREAN("put", apiURL, accessToken, obj);
    
            const dffMessage = `Date updated Successfully. We will remind you before expected transfusion`;
            resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    });
};
