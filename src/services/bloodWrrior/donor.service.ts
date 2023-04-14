import { GetPatientInfoService } from '../support.app.service';
import { Lifecycle, scoped, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';

@scoped(Lifecycle.ContainerScoped)
export class DonorService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService
    ){}

    async donorService (eventObj) {
        try {
            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);
            const apiURL = `donors/search?phone=${phoneNumber}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);

            const bloodGroup = requestBody.Data.Donors.Items[0].BloodGroup;
            const name = requestBody.Data.Donors.Items[0].DisplayName;
            let lastDonationDate = requestBody.Data.Donors.Items[0].LastDonationDate ?? null;
            const donorType = requestBody.Data.Donors.Items[0].DonorType ?? null;
            const donorTypeString = donorType === "One time" ? "Emergency" : "Bridge";
            if (lastDonationDate) {
                lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
            }

            const dffMessage = `Welcome back Blood Warrior ${name},\n\nThank you for your continuous support as a ${donorTypeString} Donor. \nAs you are a registered Blood Warrior,
            We could fetch the following details:
            *Blood Group:* ${bloodGroup}
            *Last Donation Date:* ${lastDonationDate}\nIf the details are correct, please click proceed or if you can register as a new donor.`;
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
