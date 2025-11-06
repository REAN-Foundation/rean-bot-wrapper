import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import { NeedleService } from '../needle.service.js';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service.js';

@scoped(Lifecycle.ContainerScoped)
export class VolunteerService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService
    ){}

    async volunteerService (eventObj) {
        try {
            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);
            const apiURL = `volunteers/search?phone=${phoneNumber}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);

            const bloodGroup = requestBody.Data.Volunteers.Items[0].BloodGroup;
            const name = requestBody.Data.Volunteers.Items[0].DisplayName;
            let lastDonationDate = requestBody.Data.Volunteers.Items[0].LastDonationDate ?? null;
            if (lastDonationDate) {
                lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
            }
            const dffMessage = `Welcome back Blood Warrior ${name},\n\nAs you are a registered Blood Warrior, we could fetch the following details:
            *Blood Group:* ${bloodGroup}
            *Last Donation Date:* ${lastDonationDate}\nIf the details are correct, please click proceed or if you can register as a new donor.`;
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
