import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { getPhoneNumber, needleRequestForREAN } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';

@autoInjectable()
export class DonorService {

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    async donorService (eventObj) {
        try {
            const phoneNumber = await getPhoneNumber(eventObj);
            const apiURL = `donors/search?phone=${phoneNumber}`;
            const requestBody = await needleRequestForREAN("get", apiURL);

            const bloodGroup = requestBody.Data.Donors.Items[0].BloodGroup;
            const name = requestBody.Data.Donors.Items[0].DisplayName;
            let lastDonationDate = requestBody.Data.Donors.Items[0].LastDonationDate ?? null;
            const donorType = requestBody.Data.Donors.Items[0].DonorType ?? null;
            const donorTypeString = donorType === "One time" ? "Emergency" : "Bridge";
            if (lastDonationDate) {
                lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
            }

            const dffMessage = `Welcome back Blood Warrior ${name},\nThank you for your continuous support as a ${donorTypeString} Donor. As you are a registered Blood Warrior,
            we could fetch the following details:
            Blood Group: ${bloodGroup},
            Last Donation Date: ${lastDonationDate}\nIf the details are correct, please click proceed or if you can register as a new donor.`;
            console.log(dffMessage);

            const proceedButtonId = donorType === "One time" ? "Donor_Confirm_Emergency" : "Donor_Confirm_Bridge";
            const payloadButtons = await whatsappMetaButtonService("Proceed",proceedButtonId,"Register as a Donor","Register_Donor");
            
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                    payloadButtons
                ]
            };
            return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register donor with blood warrior service error');
        }
    }

}
