import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { inject, Lifecycle, scoped } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
export class AcceptDonationRequestService {

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async sendUserMessage (eventObj) {
        return new Promise(async (resolve,reject) => {
            try {
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
                const donationRecordId = requestBody.Data.DonationRecord.Items[0].id;
                const buttons = await whatsappMetaButtonService("Yes", "Checklist_Yes","No", "Checklist_No");
                const dffMessage = `Thank you for accepting the request. \n\nPlease go through the checklist and confirm if you are eligible to donate. https://drive.google.com/file/d/1-g_GTVZcjO0GSkaAK0IMXZHHGLlKpMxk/view \nRegards \nTeam Blood Warriors`;
                resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }, buttons] } });

                //update donation record with acceptance
                const obj = {
                    DonorAcceptedDate : new Date().toISOString()
                };
                await this.bloodWarriorCommonService.updateDonationRecord(donationRecordId, obj);

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'accept blood donation request with patient service error');
            }
        });
    }

}
