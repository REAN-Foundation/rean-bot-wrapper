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
            const dffMessage = `Welcome to Blood Warriors ${name},\nThank you for your continuous support as a volunteer:
            Volunteer Name: ${name},
            Blood Group: ${bloodGroup},
            Last Donation Date: ${lastDonationDate}\nIf the details are correct, please click proceed or if you can register as a new volunteer.`;
            console.log(dffMessage);

            const payloadButtons = await whatsappMetaButtonService("Proceed","Volunteer_Confirm","Register Volunteer","Register_Volunteer");
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
