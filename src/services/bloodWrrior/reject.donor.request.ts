import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container } from 'tsyringe';
import { RaiseDonationRequestService } from './raise.request.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

@autoInjectable()
export class RejectDonorRequestService {

    private _platformMessageService?: platformServiceInterface;

    private raiseDonationRequestService = new RaiseDonationRequestService();

    private bloodWarriorCommonService = new BloodWarriorCommonService();

    public rejectDonorRequest = async (eventObj) => {
        return new Promise(async (resolve) => {
            try {
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await needleRequestForREAN("get", apiURL);
                const donationRecordId = requestBody.Data.DonationRecord.Items[0].id;
                let volunteerUserId = null;
                let patientUserId = null;
                if (donor.DonorType === 'One time') {
                    volunteerUserId = requestBody.Data.DonationRecord.Items[0].VolunteerOfEmergencyDonor;
                } else {
                    volunteerUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.VolunteerUserId;
                    patientUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.PatientUserId;
                }
                const dffMessage = `Sorry to know this. We will contact you later.`;
                resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

                const payload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = container.resolve(payload.source);

                //update donation record with rejection
                const obj = {
                    DonorRejectedDate : new Date().toISOString()
                };
                await this.bloodWarriorCommonService.updateDonationRecord(donationRecordId, obj);

                //message send to volunteer
                let patientName = 'patient';
                if (patientUserId !== null) {
                    const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(patientUserId);
                    patientName = patient.User.Person.DisplayName;
                }
                const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                const message = `Hi ${volunteer.User.Person.DisplayName},\n${donor.DisplayName} has rejected or ineligible to donate for ${patientName}.
            Please contact other eligible donors or raise a request.`;
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = payload.source;
                response_format.sessionId = volunteerPhone;
                response_format.messageText = message;
                response_format.message_type = "text";
                await this._platformMessageService.SendMediaMessage(response_format, null);

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Reject donation request service error');
            }
        });
    };

}
