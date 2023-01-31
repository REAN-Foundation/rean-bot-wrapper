import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container } from 'tsyringe';
import { RaiseDonationRequestService } from './raise.request.service';

@autoInjectable()
export class ChecklistDateValidationService {

    private _platformMessageService?: platformServiceInterface;

    private bloodWarriorCommonService = new BloodWarriorCommonService();

    private raiseDonationRequestService = new RaiseDonationRequestService();

    checklistDateValidationService = async (eventObj) => {
        return new Promise(async (resolve,reject) => {
            try {
                const transfusionDate = eventObj.body.queryResult.parameters.date;
                let donor = null;
                donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

                const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
                const requestBody = await needleRequestForREAN("get", apiURL);
                let donationDate = requestBody.Data.DonationRecord.Items[0].DonationDetails.NextDonationDate;
                const volunteerUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.VolunteerUserId;
                const patientUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.PatientUserId;
                let dffMessage = "";
                if (transfusionDate.split("T")[0] === donationDate.split("T")[0]) {
                    dffMessage = `Date Validation Success. \nHere are your donation details.`;

                    const stringDonationDate = new Date(donationDate.split("T")[0]).toDateString();
                    const message = ` Donor Name: ${donor.DisplayName}, \n Blood Group: ${donor.BloodGroup}, \n Donation Date: ${stringDonationDate}`;

                    resolve( { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage + '\n' + message] } }] } });

                    const payload = eventObj.body.originalDetectIntentRequest.payload;
                    this._platformMessageService = container.resolve(payload.source);
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
                    await this._platformMessageService.SendMediaMessage(patientPhone,null,heading + `\n` + message,'text', null);

                    //message send to volunteer
                    const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
                    const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
                    await this._platformMessageService.SendMediaMessage(volunteerPhone,null,heading + `\n` + message,'text', null);
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
