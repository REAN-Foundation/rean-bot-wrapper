import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import {  needleRequestForREAN } from '../needle.service';

@autoInjectable()
export class BloodBridgeStatusService {

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    async bloodBridgeStatus (eventObj) {
        try {
            const bridgeId = eventObj.body.queryResult.parameters.bridge_id;
            const apiURL = `clinical/patient-donors/search?name=${bridgeId}`;
            let result = null;
            let dffMessage = null;
            result = await needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {

                const bloodBridge = result.Data.PatientDonors.Items[0];
                let lastDonationDate = bloodBridge.LastDonationDate ?? null;
                if (lastDonationDate) {
                    lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                }
                let nextTrnasfusionDate = bloodBridge.NextDonationDate ?? null;
                if (nextTrnasfusionDate) {
                    nextTrnasfusionDate = new Date(nextTrnasfusionDate.split("T")[0]).toDateString();
                }
                dffMessage = `Here is the summary,
        Bridge Name: ${bloodBridge.Name},
        Last Donation Date: ${lastDonationDate},
        Next Transfusion Date: ${nextTrnasfusionDate},
        Eligible Donors Count: ${result.Data.PatientDonors.Items.length},
        Donors Signed Up on Bot: Yes`;

            } else {
                dffMessage = "Error in Bridge Id Please try again. \nIf problem continues, please contact the admin";
            }
            
            console.log(dffMessage);
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                ]
            };
            return await { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register donor with blood warrior service error');
        }
    }

}
