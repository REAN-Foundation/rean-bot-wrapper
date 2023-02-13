import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { container } from 'tsyringe';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

export class SelectBloodGroupService {

    private _platformMessageService?: platformServiceInterface;

    private raiseDonationRequestService = new RaiseDonationRequestService();

    async bloodGroupService (eventObj) {
        return new Promise(async (resolve,reject) => {
            try {

                const bloodGroup = eventObj.body.queryResult.parameters.Blood_Group;
                const bloodGroupString = eventObj.body.queryResult.intent.displayName;
                
                const apiURL = `donors/search?onlyElligible=true&bloodGroup=${bloodGroup}&donorType=One time`;
                const requestBody = await needleRequestForREAN("get", apiURL);
                const donors = requestBody.Data.Donors.Items;

                if (donors.length > 0) {
                    for (const donor of donors) {
                        const donorName = donor.DisplayName;
                        let donorList = "";
                        let num = 1;
                        const seq = `\n${num}-${donorName}`;
                        donorList += seq;
                        num = num + 1;

                        const dffMessage = `\nRegards \nTeam Blood Warriors`;
                        const heading = `We have sent donation requests to these eligible one-time donors having an ${bloodGroupString} blood group.`;

                        //await whatsappMetaButtonService("Yes", "Emergency_Donation_Yes","No", "Volunteer_Confirm");

                        resolve( { donorList : donors, message   : { fulfillmentMessages : [{ text :
                            { text: [ heading + donorList + dffMessage] } }] } });
                    }

                    for (const donor of donors) {
                        const donorName = donor.DisplayName;

                        const donorPhone =
                            this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(donor.Phone);
                        
                        //await this.raiseDonationRequestService.createDonationRecord("PatientUserId", Network.id);
                        const dffMessage = `Hi ${donorName}, \nYou are an emergency donor. We need blood in coming days. Are you able to donate blood? \nRegards \nTeam Blood Warriors`;

                        const payload = eventObj.body.originalDetectIntentRequest.payload;
                        this._platformMessageService = container.resolve(payload.source);
                        const buttons = await sendApiButtonService(["Accept", "Accept_Volunteer_Request","Reject", "Reject_Donation_Request"]);
                        const response_format: Iresponse = commonResponseMessageFormat();
                        response_format.platform = payload.source;
                        response_format.sessionId = donorPhone;
                        response_format.messageText = dffMessage;
                        response_format.message_type = "interactive-buttons";
                        await this._platformMessageService.SendMediaMessage(response_format, buttons);

                        //await whatsappMetaButtonService("Yes", "Emergency_Donation_Yes","No", "Volunteer_Confirm");

                    }
                } else {
                    const dffMessage = `No, any one-time donors are eligible Or We don't find any donor having ${bloodGroupString} blood group. \nRegards \nTeam Blood Warriors`;
                    resolve( { message: { fulfillmentMessages: [{ text: { text: [ dffMessage] } }] } });
                }

            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'accept blood donation request with patient service error');
            }
        });
    }

}
