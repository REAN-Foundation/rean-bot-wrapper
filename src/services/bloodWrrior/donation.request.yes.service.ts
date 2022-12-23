import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { getPhoneNumber, needleRequestForREAN } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { RaiseDonationRequestService } from './raise.request.service';

@autoInjectable()
export class DonationRequestYesService {

    private _platformMessageService?: platformServiceInterface;

    getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

    private raiseDonationRequestService = new RaiseDonationRequestService();

    async sendUserMessage (eventObj) {
        try {
            const bridgeId = eventObj.body.queryResult.parameters.bridge_id;
            const apiURL = `clinical/patient-donors/search?name=${bridgeId}`;
            let result = null;
            result = await needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {

                const bloodBridge = result.Data.PatientDonors.Items[0];
                const patientUserId = bloodBridge.PatientUserId;
                const dffMessage = `We are fetching the details of elligible donor.`;
                return { sendDff       : true,
                    message       : { fulfillmentMessages: [{ text: { text: [dffMessage] } }] },
                    patientUserId : patientUserId };
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

    async raiseDonorRequest (eventObj, patientUserId: string ) {
        try {
            let result = null;

            const apiURL = `clinical/patient-donors/search?patientUserId=${patientUserId}&onlyElligible=true`;
            result = await needleRequestForREAN("get", apiURL);
            const buttons = await sendApiButtonService(["Accept", "Accept_Volunteer_Request","Reject", "Reject_Donation_Request"]);
            const donorNames = [];
            if (result.Data.PatientDonors.Items.length > 0) {
                for (const donor of result.Data.PatientDonors.Items) {
                    if (donor === null) {
                        continue;
                    }
                    const donorName = donor.DonorName;
                    const donorPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(donor.DonorPhone);
                    
                    await this.raiseDonationRequestService.createDonationRecord(donor.PatientUserId, donor.id);
                    const dffMessage = `Hi ${donorName}, \nWe need blood in coming days. Are you able to donate blood? \nRegards \nTeam Blood Warriors`;

                    const payload = eventObj.body.originalDetectIntentRequest.payload;
                    this._platformMessageService = container.resolve(payload.source);
                    await this._platformMessageService.SendMediaMessage(donorPhone,null,dffMessage,'interactive-buttons', buttons);

                    donorNames.push(donorName);
                }
            }
            console.log(`Succesfully donation request send to donor. DonorName : ${donorNames}.`);

            return { donorNames };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to send request to donors');
        }
    }

    async notifyVolunteer (eventObj, patientUserId, donorNames) {
        try {
            let volunteerPhone = await getPhoneNumber(eventObj);
            volunteerPhone = this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteerPhone);
            let donorList = "";
            let num = 1;
            donorNames.forEach(name => {
                const seq = `\n${num}) Donor Name: ${name}`;
                donorList += seq;
                num = num + 1;
            });
            const dffMessage = `Request sent successfully to following Donors.${donorList} \nRegards \nTeam Blood Warriors`;
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = container.resolve(payload.source);
            const result = await this._platformMessageService.SendMediaMessage(volunteerPhone,null,dffMessage,'text', null);
            if (result.statusCode === 200 ) {
                console.log(`Succesfully notification send to volunteer. Volunteer Phone : ${volunteerPhone}.`);
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to notify volunteers about donor request');
        }
    }

}