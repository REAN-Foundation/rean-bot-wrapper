import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container } from 'tsyringe';
import { RaiseDonationRequestService } from './raise.request.service';

@autoInjectable()
export class RejectDonorRequestService {

    private _platformMessageService?: platformServiceInterface;

    private raiseDonationRequestService = new RaiseDonationRequestService();

    private bloodWarriorCommonService = new BloodWarriorCommonService();

    public rejectDonorRequest = async (eventObj) => {
        return new Promise(async (resolve,reject) => {
            try {
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await needleRequestForREAN("get", apiURL);
                const patientUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.PatientUserId;
                const volunteerUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.VolunteerUserId;
                const dffMessage = `Sorry to know this. We will contact you later.`;
                resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

                const payload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = container.resolve(payload.source);

                //message send to volunteer
                const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(patientUserId);
                const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                const message = `Hi ${volunteer.User.Person.DisplayName},\n${donor.DisplayName} has rejected or ineligible to donate for ${patient.User.Person.DisplayName}
            Please contact other eligible donors or raise a request.`;
                await this._platformMessageService.SendMediaMessage(volunteerPhone,null,message,'text', null);

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Reject donation request service error');
            }
        });
    };

}
