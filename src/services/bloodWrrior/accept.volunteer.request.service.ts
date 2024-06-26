import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { BloodWarriorCommonService } from './common.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

@scoped(Lifecycle.ContainerScoped)
export class AcceptVolunteerRequestService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async sendUserMessage (eventObj) {
        return new Promise(async (resolve) => {
            try {
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
                const donationRecordId = requestBody.Data.Donation.Items[0].id;
                let volunteerUserId = null;
                if (donor.DonorType === 'One time') {
                    volunteerUserId = requestBody.Data.Donation.Items[0].VolunteerOfEmergencyDonor;
                } else {
                    volunteerUserId = requestBody.Data.Donation.Items[0].DonationDetails.VolunteerUserId;
                }
                const dffMessage = `Thank you for accepting the request. We are in the process of scheduling a donation. \nRegards \nTeam Blood Warriors`;
                resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });
                
                //update donation record with acceptance
                
                const obj = {
                    DonorAcceptedDate : new Date().toISOString()
                };
                await this.bloodWarriorCommonService.updateDonationRecord(donationRecordId, obj);

                const payload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = eventObj.container.resolve(payload.source);

                //message send to volunteer
                const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                const message = `Hi ${volunteer.User.Person.DisplayName},\n${donor.DisplayName} has accepted the request.
            Please contact the donor and schedule the donation`;
                const buttons = await sendApiButtonService(["Schedule a Donation", "Schedule_Donation", "End This Process", "End_This_Process"]);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = payload.source;
                response_format.sessionId = volunteerPhone;
                response_format.messageText = message;
                response_format.message_type = "interactivebuttons";
                await this._platformMessageService.SendMediaMessage(response_format, buttons);

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
            }
        });
    }

}
