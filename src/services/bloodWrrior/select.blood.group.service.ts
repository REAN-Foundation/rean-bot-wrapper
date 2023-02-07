import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { templateButtonService } from '../whatsappmeta.button.service';
import { container } from 'tsyringe';
import { BloodWarriorCommonService } from './common.service';

export class SelectBloodGroupService {

    private _platformMessageService?: platformServiceInterface;

    private raiseDonationRequestService = new RaiseDonationRequestService();

    private bloodWarriorCommonService = new BloodWarriorCommonService();

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

                        resolve( { donorList : donors, message   : { fulfillmentMessages : [{ text :
                            { text: [ heading + donorList + dffMessage] } }] } });
                    }
                    const volunteer = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);

                    for (const donor of donors) {
                        const donorName = donor.DisplayName;

                        const donorPhone =
                            this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(donor.Phone);
                        const obj = {
                            EmergencyDonor            : donor.UserId,
                            VolunteerOfEmergencyDonor : volunteer.UserId,
                            RequestedQuantity         : 1,
                            RequestedDate             : new Date().toISOString()
                                .split('T')[0]
                        };
                        await this.raiseDonationRequestService.createDonationRecord(obj);
                        const dffMessage = `Hi ${donorName}, \nYou are an emergency donor. We need blood in coming days. Are you able to donate blood? \nRegards \nTeam Blood Warriors`;

                        const payload = eventObj.body.originalDetectIntentRequest.payload;
                        this._platformMessageService = container.resolve(payload.source);
                        const variable = [
                            {
                                type : "text",
                                text : donorName
                            }];
                        const buttons = await templateButtonService(["Accept_Volunteer_Request","Reject_Donation_Request"]);
                        await this._platformMessageService.SendMediaMessage(donorPhone,null,dffMessage,'template', buttons, "donor_donation_volunteer", variable);

                    }
                    const apiURL = `volunteers/${volunteer.UserId}`;
                    const obj = {
                        SelectedBloodGroup : bloodGroup
                    };
                    await needleRequestForREAN("put", apiURL, null, obj);
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
