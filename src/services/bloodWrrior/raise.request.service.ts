import { GetPatientInfoService } from '../support.app.service';
import { container, autoInjectable } from 'tsyringe';
import { Logger } from '../../common/logger';
import { needleRequestForREAN } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { templateButtonService } from '../whatsappmeta.button.service';

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
            const dffMessage = `Hi ${name}, \n\nThe blood transfusion request is raised successfully and request to donors is sent. \n\nWe will send you a confirmation when donation is scheduled. \n\nRegards \nTeam Blood Warriors.`;
            return { sendDff       : true,
                message       : { fulfillmentMessages: [{ text: { text: [dffMessage] } }] },
                patientUserId : patientUserId,
                name          : name };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

    async raiseBloodDonation (eventObj, patientUserId: string, name: string) {
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

            apiURL = `clinical/patient-donors/search?patientUserId=${patientUserId}&onlyElligible=true`;
            result = await needleRequestForREAN("get", apiURL);
            const payload = {};
            payload["buttonIds"] = await templateButtonService(["Accept_Donation_Request","Reject_Donation_Request"]);
            const donorNames = [];
            if (result.Data.PatientDonors.Items.length > 0) {
                for (const donor of result.Data.PatientDonors.Items) {
                    if (donor === null) {
                        continue;
                    }
                    const donorName = donor.DonorName;
                    const donorPhone = this.convertPhoneNoReanToWhatsappMeta(donor.DonorPhone);
                    let lastDonationDate = donor.LastDonationDate ?? null;
                    if (lastDonationDate !== null) {
                        lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                    }
                    const object = {
                        PatientUserId     : donor.PatientUserId,
                        NetworkId         : donor.id,
                        RequestedQuantity : 1,
                        RequestedDate     : new Date().toISOString()
                            .split('T')[0]
                    };
                    await this.createDonationRecord(object);
                    payload["variables"] = [
                        {
                            type : "text",
                            text : donorName
                        },
                        {
                            type : "text",
                            text : name
                        },
                        {
                            type : "text",
                            text : "blood"
                        },
                        {
                            type : "text",
                            text : stringTFDate
                        },
                        {
                            type : "text",
                            text : "blood"
                        },
                        {
                            type : "text",
                            text : stringDate
                        },
                        {
                            type : "text",
                            text : "Blood"
                        }];
                    payload["templateName"] = "donor_push_notification";
                    const dffMessage = `Hi ${donorName}, \n"${name}" requires blood. \nThe transfusion is scheduled to be ${stringTFDate}.
                    Would you be willing to donate blood on or before ${stringDate}? \nRegards \nTeam Blood Warriors`;

                    const previousIntentPayload = eventObj.body.originalDetectIntentRequest.payload;
                    this._platformMessageService = container.resolve(previousIntentPayload.source);
                    const response_format: Iresponse = commonResponseMessageFormat();
                    response_format.platform = previousIntentPayload.source;
                    response_format.sessionId = donorPhone;
                    response_format.messageText = dffMessage;
                    response_format.message_type = "template";
                    await this._platformMessageService.SendMediaMessage(response_format, payload);

                    donorNames.push(donorName);
                }
            }
            console.log(`Succesfully donation request send to donor. DonorName : ${donorNames}.`);

            return { stringTFDate, donorNames };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to send request to donors');
        }
    }

    async notifyVolunteer (eventObj, patientUserId, patientName, transfusionDate, donorNames) {
        try {
            let result = null;
            const apiURL = `clinical/patient-donors/search?patientUserId=${patientUserId}&onlyElligible=true`;
            result = await needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {

                const bloodBridge = result.Data.PatientDonors.Items[0];

                const apiURL = `volunteers/${bloodBridge.VolunteerUserId}`;
                const response = await needleRequestForREAN("get", apiURL);

                const volunteerName = response.Data.Volunteer.User.Person.DisplayName;
                const volunteerPhone = await this.convertPhoneNoReanToWhatsappMeta(
                    response.Data.Volunteer.User.Person.Phone);
                const payload = {};
                let donorList = "";
                let num = 1;
                donorNames.forEach(name => {
                    const seq = `\\n${num}-${name}`;
                    
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    donorList += seq;
                    num = num + 1;
                });
                payload["variables"] = [
                    {
                        type : "text",
                        text : volunteerName
                    },
                    {
                        type : "text",
                        text : patientName
                    },
                    {
                        type : "text",
                        text : "blood"
                    },
                    {
                        type : "text",
                        text : transfusionDate
                    },
                    {
                        type : "text",
                        text : donorList
                    },
                    {
                        type : "text",
                        text : "Blood"
                    }];
                payload["templateName"] = "volunteer_push_notification";

                //const dffMessage = `Hi ${volunteerName}, \n"${patientName}" requires blood.
                //The transfusion is scheduled to be ${transfusionDate}.
                //Donation request is sent to the following donors.${donorList}
                //We will send you a reminder if no one responds or anyone accepts. \nRegards \nTeam Blood Warriors`;
                const previousIntentPayload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = container.resolve(previousIntentPayload.source);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = previousIntentPayload.source;
                response_format.sessionId = volunteerPhone;
                response_format.messageText = null;
                response_format.message_type = "template";
                result = await this._platformMessageService.SendMediaMessage(response_format, payload);
                if (result.statusCode === 200 ) {
                    console.log(`Succesfully notification send to volunteer. Volunteer Name : ${volunteerName}.`);
                }
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to notify volunteers about donor request');
        }
    }

    public async createDonationRecord (obj: any) {
        try {
            let result = null;
            const apiURL = `clinical/donation-record`;
            result = await needleRequestForREAN("post", apiURL, null, obj);
            console.log(`Succesfully added donation record and Id is ${result.Data.DonationRecord.id}`);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to create donation record');
        }
    }

    public convertPhoneNoReanToWhatsappMeta(donorPhone) {
        const countryCode = donorPhone.split("-")[0];
        const num = donorPhone.split("-")[1];
        const code =  countryCode.substring(1);
        donorPhone = code.concat(num);
        return donorPhone;
    }

}
