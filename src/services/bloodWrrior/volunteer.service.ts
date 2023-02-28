import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { getPhoneNumber, needleRequestForREAN } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';

@autoInjectable()
export class VolunteerService {

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    async volunteerService (eventObj) {
        try {
            const phoneNumber = await getPhoneNumber(eventObj);
            const apiURL = `volunteers/search?phone=${phoneNumber}`;
            const requestBody = await needleRequestForREAN("get", apiURL);

            const bloodGroup = requestBody.Data.Volunteers.Items[0].BloodGroup;
            const name = requestBody.Data.Volunteers.Items[0].DisplayName;
            let lastDonationDate = requestBody.Data.Volunteers.Items[0].LastDonationDate ?? null;
            if (lastDonationDate) {
                lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
            }
            const dffMessage = `Welcome back Blood Warrior ${name},\nAs you are a registered Blood Warrior, we could fetch the following details:
            Blood Group: *${bloodGroup}*,
            Last Donation Date: *${lastDonationDate}*\nIf the details are correct, please click proceed or if you can register as a new donor.`;
            console.log(dffMessage);

            const payloadButtons = await whatsappMetaButtonService("Proceed","Volunteer_Confirm","Register as a Donor","Register_Donor");
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                    payloadButtons
                ]
            };
            return await { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register volunteer with blood warrior service error');
        }
    }

}
