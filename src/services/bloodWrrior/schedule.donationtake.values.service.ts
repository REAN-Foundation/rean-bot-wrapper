import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

export const ScheduleDonationTakeValuesService = async (eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            const raiseDonationRequestService = new RaiseDonationRequestService();
            const bloodWarriorCommonService = new BloodWarriorCommonService();
            const bridgeId = eventObj.body.queryResult.parameters.bridge_Id;
            const donation_Date = eventObj.body.queryResult.parameters.donation_Date;
            const location = eventObj.body.queryResult.parameters.location;
            let result = null;
            let dffMessage = "";
            const apiURL = `clinical/patient-donors/search?name=${bridgeId}&onlyElligible=true`;
            result = await needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {
                const patientDonors = result.Data.PatientDonors.Items[0];
                let lastDonationDate = patientDonors.LastDonationDate ?? null;
                if (lastDonationDate) {
                    lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                }
                const patient = await bloodWarriorCommonService.getPatientPhoneByUserId(patientDonors.PatientUserId);
                await raiseDonationRequestService.createDonationRecord(patientDonors.PatientUserId, patientDonors.id);
                dffMessage = `Congratulations! \nThe donation has been successfully scheduled.`;
                const commonMessage = `
            Donor name: ${patientDonors.DonorName},
            Blood Group: ${patientDonors.BloodGroup},
            Date: ${new Date(donation_Date.split("T")[0]).toDateString()},
            Donation Type: ${patientDonors.DonorType},
            Patient name: ${patient.User.Person.DisplayName},
            Maps: ${location}`;
                resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage + commonMessage] } }] } });

                //Fetch donation reminders for donors
                const nextDonationDate = new Date(donation_Date.split("T")[0]);
                await bloodWarriorCommonService.fetchDonorDonationReminders(patientDonors.DonorUserId,nextDonationDate);

                //Message sent to patient
                const heading = `Hi ${patient.User.Person.DisplayName}, `;
                const payload = eventObj.body.originalDetectIntentRequest.payload;
                const _platformMessageService: platformServiceInterface = container.resolve(payload.source);
                const patientPhone =
                    raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patient.User.Person.Phone);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = payload.source;
                response_format.sessionId = patientPhone;
                response_format.messageText = heading + dffMessage + commonMessage;
                response_format.message_type = "text";
                await _platformMessageService.SendMediaMessage(response_format, null);

                //Message sent to donor
                const heading1 = `Hi ${patientDonors.DonorName}, \nThe donation request has been created by volunteer.`;
                const donorPhone =
                    raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patientDonors.DonorPhone);
                response_format.sessionId = donorPhone;
                response_format.messageText = heading1 + commonMessage;
                await _platformMessageService.SendMediaMessage(response_format, null);
            } else {
                dffMessage = `Sorry for the inconvenience, something went wrong.`;
                resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });
            }
            
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Schedule donation service error');
        }
    });
};
