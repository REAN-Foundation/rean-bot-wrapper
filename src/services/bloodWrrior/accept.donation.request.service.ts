import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';

@scoped(Lifecycle.ContainerScoped)
export class AcceptDonationRequestService {

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async sendUserMessage (eventObj) {
        try {
            let donor = null;
            donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

            // Need to correct it for, if same donor present in two bridges
            const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
            const donationRecord = requestBody.Data.Donation.Items[0];
            const buttons = await whatsappMetaButtonService("Yes", "Checklist_Yes","No", "Checklist_No");
            const dffMessage = `Thank you for accepting the request. \n\nPlease go through the checklist and confirm if you are eligible to donate. https://drive.google.com/file/d/1-g_GTVZcjO0GSkaAK0IMXZHHGLlKpMxk/view \nRegards \nTeam Blood Warriors`;

            const body : QueueDoaminModel =  {
                Intent : "Update_Accept_Donation_Flags",
                Body   : {
                    EventObj       : eventObj,
                    DonationRecord : donationRecord,
                    DonorUserId    : donor.UserId
                }
            };
            FireAndForgetService.enqueue(body);
            return ( { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }, buttons] } });

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'accept blood donation request with patient service error');
        }
    }

    async updateCommunicationDetails (body) {
        try {
            const donationRecord = body.DonationRecord;

            //update donation record with acceptance
            const obj = {
                DonorAcceptedDate : new Date().toISOString()
            };
            await this.bloodWarriorCommonService.updateDonationRecord(donationRecord.id, obj);

            //update donation communication with donor, volunteer userIds
            const bodyObj = {
                PatientUserId    : donationRecord.PatientUserId,
                DonorUserId      : body.DonorUserId,
                VolunteerUserId  : body.DonationRecord.DonationDetails.VolunteerUserId,
                DonationRecordId : donationRecord.id
            };
            console.log(`Update donation communication details ${JSON.stringify(bodyObj)}`);
            await this.bloodWarriorCommonService.updatePatientCommunicationFlags(bodyObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'update accept blood donation flags with donor service error');
        }
    }

}
