import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { BloodWarriorCommonService } from './common.service';

@scoped(Lifecycle.ContainerScoped)
export class ScheduleDonationService {

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService: BloodWarriorCommonService,
        @inject(NeedleService) private needleService: NeedleService
    ) {}

    async ScheduleDonation (eventObj) {
        try {
            const phoneNumber = eventObj.body.queryResult.parameters.phoneNumber;
            let result = null;
            let dffMessage = "";
            let payloadButtons = null;
            const apiURL = `donors/search?phone=${phoneNumber}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.Donors.Items.length > 0) {
                const donor = result.Data.Donors.Items[0];
                let lastDonationDate = donor.LastDonationDate ?? null;
                if (lastDonationDate) {
                    lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                }
                this.updateVolunteerWithSelectedPhone(eventObj);
                dffMessage = `Donor Found: \n  Donor Name: ${donor.DisplayName}, \n  Donor Blood Group: ${donor.BloodGroup}, \n  Last Donation Date: ${lastDonationDate}
                    \nClick "Yes" to proceed`;
                payloadButtons = await whatsappMetaButtonService("Yes","Schedule_Donation_Elligibity","No! Re-enter details","Schedule_Donation");
                return { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }, payloadButtons] } };
    
            } else {
                dffMessage = `Donor not Found. \nPlease register the donor and schedule the donation`;
                return { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
            }
    
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Schedule donation service error');
        }
    }

    async updateVolunteerWithSelectedPhone (eventObj) {
        try {
            const phoneNumber = eventObj.body.queryResult.parameters.phoneNumber;
            
            //update phone number in volunteer profile
            const volunteer = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);
            const apiURL = `volunteers/${volunteer.UserId}`;
            const obj = {
                SelectedPhoneNumber : phoneNumber
            };
            await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
        } catch (err) {
            Logger.instance()
                .log_error(err.message,500,'Schedule donation service error');
        }
    }
    
}
