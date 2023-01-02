import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { getPhoneNumber, needleRequestForREAN } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { BloodWarriorCommonService } from './common.service';

@autoInjectable()
export class AcceptVolunteerRequestService {

    private _platformMessageService?: platformServiceInterface;

    private raiseDonationRequestService = new RaiseDonationRequestService();

    private bloodWarriorCommonService = new BloodWarriorCommonService();

    async sendUserMessage (eventObj) {
        return new Promise(async (resolve,reject) => {
            try {
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await needleRequestForREAN("get", apiURL);
                const volunteerUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.VolunteerUserId;
                const dffMessage = `Thank you for accepting the request. We are in the process of scheduling a donation. \nRegards \nTeam Blood Warriors`;
                resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

                const payload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = container.resolve(payload.source);

                const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                const message = `Hi ${volunteer.User.Person.DisplayName},\n${donor.DisplayName} has accepted the request.
            Please contact the donor and schedule the donation`;
                const buttons = await sendApiButtonService(["Schedule a Donation", "Schedule_Donation", "End This Process", "End_This_Process"]);
                await this._platformMessageService.SendMediaMessage(volunteerPhone,null,message,'interactive-buttons', buttons);

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
            }
        });
    }

}
