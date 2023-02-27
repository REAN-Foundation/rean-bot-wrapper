import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';

export const ScheduleOneTimeTakeValuesService = async (eventObj) => {
    return new Promise(async (resolve) => {
        try {
            const raiseDonationRequestService = new RaiseDonationRequestService();
            const bloodWarriorCommonService = new BloodWarriorCommonService();
            const donation_Date = eventObj.body.queryResult.parameters.donation_Date;
            const location = eventObj.body.queryResult.parameters.location;
            const volunteer = await bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);
            let result = null;
            let dffMessage = "";
            let donor = null;
            const apiURL = `donors/search?phone=${volunteer.SelectedPhoneNumber}&donorType=One time`;
            result = await needleRequestForREAN("get", apiURL);
            if (result.Data.Donors.Items.length > 0) {
                donor = result.Data.Donors.Items[0];
                const obj = {
                    EmergencyDonor            : donor.UserId,
                    VolunteerOfEmergencyDonor : volunteer.UserId,
                    RequestedQuantity         : 1,
                    RequestedDate             : new Date().toISOString()
                        .split('T')[0],
                    DonationDate : donation_Date.split("T")[0]
                };
                await raiseDonationRequestService.createDonationRecord(obj);

                dffMessage = `Congratulations! \nThe donation has been successfully scheduled.`;
                const commonMessage = `
            Donor name: ${donor.DisplayName},
            Blood Group: ${donor.BloodGroup},
            Date: ${new Date(donation_Date.split("T")[0]).toDateString()},
            Donation Type: ${donor.DonorType},
            Maps: ${location}`;
                resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage + commonMessage] } }] } });

                //Fetch donation reminders for donors
                const nextDonationDate = new Date(donation_Date.split("T")[0]);
                await bloodWarriorCommonService.fetchDonorDonationReminders(donor.UserId,nextDonationDate);

                //Message sent to donor
                const heading1 = `Hi ${donor.DisplayName}, \nThe donation request has been created by volunteer.`;
                const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
                const donorPhone =
                    raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(donor.Phone);
                const _platformMessageService: platformServiceInterface = container.resolve(previousPayload.source);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = previousPayload.source;
                response_format.sessionId = donorPhone;
                response_format.messageText = heading1 + commonMessage;
                response_format.message_type = "text";

                await _platformMessageService.SendMediaMessage(response_format, null);
            } else {
                dffMessage = `Donor not found with this ${volunteer.SelectedPhoneNumber} phone number.`;
                resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });
            }
            
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Schedule one time donation service error');
        }
    });
};
