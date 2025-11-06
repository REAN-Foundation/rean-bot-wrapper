import { Logger } from '../../common/logger.js';
import { NeedleService } from '../needle.service.js';
import { BloodWarriorCommonService } from './common.service.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { RaiseDonationRequestService } from './raise.request.service.js';
import type { Iresponse } from '../../refactor/interface/message.interface.js';
import { commonResponseMessageFormat } from '../common.response.format.object.js';
import { sendApiButtonService } from '../whatsappmeta.button.service.js';

@scoped(Lifecycle.ContainerScoped)
export class RejectDonorRequestService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    public rejectDonorRequest = async (eventObj) => {
        return new Promise(async (resolve) => {
            try {
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
                const donationRecordId = requestBody.Data.Donation.Items[0].id;
                const donationRecord = requestBody.Data.Donation.Items[0];
                let volunteerUserId = null;
                let patientUserId = null;
                if (donor.DonorType === 'One time') {
                    volunteerUserId = requestBody.Data.Donation.Items[0].VolunteerOfEmergencyDonor;
                } else {
                    volunteerUserId = requestBody.Data.Donation.Items[0].DonationDetails.VolunteerUserId;
                    patientUserId = requestBody.Data.Donation.Items[0].DonationDetails.PatientUserId;
                }
                const dffMessage = `Sorry to know this. We will contact you later.`;
                resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

                const payload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = eventObj.container.resolve(payload.source);

                //update donation record with rejection
                const obj = {
                    DonorRejectedDate : new Date().toISOString()
                };
                await this.bloodWarriorCommonService.updateDonationRecord(donationRecordId, obj);

                //update donation  with rejection
                const obj1 = {
                    LastDonationDate : new Date().toISOString()
                };
                await this.makeDonorInEligible(donationRecord.NetworkId, obj1);

                //message send to volunteer
                let patientName = 'patient';
                if (patientUserId !== null) {
                    const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(patientUserId);
                    patientName = patient.User.Person.DisplayName;
                }
                const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                const message = `Hi ${volunteer.User.Person.DisplayName},\n\n${donor.DisplayName} has rejected or ineligible to donate for ${patientName}.
            \n\nPlease contact other eligible donors or raise a request.`;
                const buttons = await sendApiButtonService(["Schedule a Donation", "Schedule_Donation", "Take One Time Donors", "Emergency_Donation"]);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = payload.source;
                response_format.sessionId = volunteerPhone;
                response_format.messageText = message;
                response_format.message_type = "interactivebuttons";
                await this._platformMessageService.SendMediaMessage(response_format, buttons);

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Reject donation request service error');
            }
        });
    };

    public makeDonorInEligible = async (networkId, obj) => {
        const apiURL = `clinical/patient-donors/${networkId}`;
        await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
        console.log(`Succesfully make donor non eligible with network id ${networkId}.`);
    };

}
