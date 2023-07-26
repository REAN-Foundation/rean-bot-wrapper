import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { container, inject, Lifecycle, scoped } from 'tsyringe';
import { RaiseDonationRequestService } from './raise.request.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

@scoped(Lifecycle.ContainerScoped)
export class ChecklistDateValidationService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    checklistDateValidationService = async (eventObj) => {
        return new Promise(async (resolve) => {
            try {
                const transfusionDate = eventObj.body.queryResult.parameters.date;
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
                let donationDate = requestBody.Data.DonationRecord.Items[0].DonationDetails.NextDonationDate;
                const volunteerUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.VolunteerUserId;
                const patientUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.PatientUserId;
                const requestedQuantity = requestBody.Data.DonationRecord.Items[0].DonationDetails.QuantityRequired;
                let dffMessage = "";
                if (transfusionDate.split("T")[0] === donationDate.split("T")[0]) {
                    dffMessage = `Date Validation Success. \nHere are your donation details.`;

                    const stringDonationDate = new Date(donationDate.split("T")[0]).toDateString();
                    const message = ` *Donor Name:* ${donor.DisplayName}, \n *Blood Group:* ${donor.BloodGroup}, \n *Required Quantity:* ${requestedQuantity} unit, \n *Donation Date:* ${stringDonationDate}`;

                    resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage + '\n' + message] } }] } });

                    const payload = eventObj.body.originalDetectIntentRequest.payload;
                    this._platformMessageService = eventObj.container.resolve(payload.source);
                    const heading = `Here are the details of the confirmed donor`;

                    //Fetch donation reminders for donors
                    if (donationDate) {
                        donationDate = new Date(donationDate.split("T")[0]);
                        
                        //donationDate.setDate(donationDate.getDate() - 1);
                    }
                    await this.bloodWarriorCommonService.fetchDonorDonationReminders(donor.UserId, donationDate);

                    //message send to patient
                    const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(patientUserId);
                    const patientPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patient.User.Person.Phone);
                    const response_format: Iresponse = commonResponseMessageFormat();
                    response_format.platform = payload.source;
                    response_format.sessionId = patientPhone;
                    response_format.messageText = heading + `\n` + message;
                    response_format.message_type = "text";
                    await this._platformMessageService.SendMediaMessage(response_format, null);

                    //message send to volunteer
                    const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                    const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                    response_format.sessionId = volunteerPhone;
                    response_format.messageText = heading + `\n` + message;
                    response_format.message_type = "text";
                    await this._platformMessageService.SendMediaMessage(response_format, null);
                } else {
                    dffMessage = "The donation date you entered is not correct please try again.";
                    resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });
                }

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Register patient with blood warrior messaging service error');
            }
        });
    };

}
