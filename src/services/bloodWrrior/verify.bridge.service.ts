import { Logger } from '../../common/logger';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { needleRequestForREAN } from '../needle.service';

export const VerifyBridgeService = async (eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            const dialoflowMessageFormattingService: dialoflowMessageFormatting = new dialoflowMessageFormatting();
            const bridgeId = eventObj.body.queryResult.parameters.bridge_Id;
            const phoneNumber = eventObj.body.queryResult.parameters.phoneNumber;
            let result = null;
            let dffMessage = "";
            const apiURL = `clinical/patient-donors/search?name=${bridgeId}&onlyElligible=true`;
            result = await needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {
                resolve(dialoflowMessageFormattingService.triggerIntent("Blood_Bridge_Verify_Take_Values",eventObj));
            } else {
                dffMessage = `Invalid Bridge ID - Please enter again`;
                resolve( { fulfillmentMessages: [{ text: { text: [dffMessage] } }] });
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Schedule donation service error');
        }
    });
};
