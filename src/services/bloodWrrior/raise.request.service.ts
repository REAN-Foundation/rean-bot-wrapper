/* eslint-disable @typescript-eslint/no-unused-vars */
import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';

@autoInjectable()
export class RaiseDonationRequestService {

    private _platformMessageService?: platformServiceInterface;

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    async sendUserMessage (eventObj) {

        try {
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            const patientUserId = result.message[0].UserId;
            const name = result.message[0].DisplayName;
            const dffMessage = `Hi ${name}, \nThe blood donation request is raised successfully and request to donors is sent. We will send you a confirmation when donation is scheduled. \nRegards \nTeam Blood Warriors.`;
            return { sendDff       : true,
                message       : { fulfillmentMessages: [{ text: { text: [dffMessage] } }] },
                patientUserId : patientUserId,
                name          : name };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

    async raiseBloodDonation (eventObj, patientUserId, name) {
        try {
            let result = null;
            let apiURL = `patient-health-profiles/${patientUserId}`;
            result = await needleRequestForREAN("get", apiURL);
            const transfusionDate = result.Data.HealthProfile.BloodTransfusionDate;
            const stringTFDate = new Date(transfusionDate).toDateString();

            //Sub 3 days from transfusion date
            const d = new Date(`${stringTFDate}`);
            d.setDate(d.getDate() - 3);
            const stringDate = new Date(d).toDateString();

            apiURL = `donors/search?acceptorUserId=${patientUserId}`;
            result = await needleRequestForREAN("get", apiURL);
            const donorName = result.Data.Donors.Items[0].DisplayName;
            const donorPhone = await this.convertPhoneNoReanToWhatsappMeta(result);
            let lastDonationDate = result.Data.Donors.Items[0].LastDonationDate ?? null;
            lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                
            const dffMessage = `Hi ${donorName}, \n"${name}" requires blood. \nThe transfusion is scheduled to be ${stringTFDate}.
                Would you be willing to donate blood on or before ${stringDate}? \nRegards \nTeam Blood Warriors`;

            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const buttons = await sendApiButtonService(["Accept", "Accept_Donation_Request","Reject", "Reject_Donation_Request"]);
            this._platformMessageService = container.resolve(payload.source);
            result = await this._platformMessageService.SendMediaMessage(donorPhone,null,dffMessage,'interactive-buttons', buttons);
            return { name: donorName, result };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

    public convertPhoneNoReanToWhatsappMeta(result) {
        let donorPhone = result.Data.Donors.Items[0].Phone;
        const countryCode = donorPhone.split("-")[0];
        const num = donorPhone.split("-")[1];
        const code =  countryCode.substring(1);
        donorPhone = code.concat(num);
        return donorPhone;
    }

}
