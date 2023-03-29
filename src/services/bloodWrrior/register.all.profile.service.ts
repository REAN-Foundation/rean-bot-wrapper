import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

@scoped(Lifecycle.ContainerScoped)
export class RegisterAllProfileService {

    constructor(
        private _platformMessageService?: platformServiceInterface,
        @inject(NeedleService) private needleService?: NeedleService
    ){}

    async sendUserMessage (eventObj) {
        try {
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = eventObj.container.resolve(payload.source);

            const message = `Hi, You have successfully registered with blood warrior team as patient.`;
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [message] } }] } };
        } catch (err) {
            Logger.instance()
                .log_error(err.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async sendUserMessageAfter(eventObj){
        try {
            const response_format: Iresponse = commonResponseMessageFormat();
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const body = payload.body;

            if (body.Profile === "Patient") {
                const obj = {
                    Phone     : `+91-${body.PatientPhone}`,
                    Password  : body.Password,
                    Email     : body.PatientEmail,
                    Gender    : body.PatientGender,
                    FirstName : body.PatientFirstName,
                    LastName  : body.PatientLastName,
                    BirthDate : new Date(body.PatientBirthDate).toISOString()
                        .split('T')[0],
                    BloodGroup           : body.PatientBloodGroup,
                    BloodTransfusionDate : new Date(body.BloodTransfusionDate).toISOString()
                        .split('T')[0],
                };
                const apiURL = `patients`;
                await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
                const message = `Hi ${body.PatientFirstName}, \nYou have successfully registered with blood warrior team as patient.`;
                const sendPayload = {};
                sendPayload["variables"] = [
                    {
                        type : "text",
                        text : body.PatientFirstName
                    },
                    {
                        type : "text",
                        text : "patient"
                    }];
                sendPayload["templateName"] = "bot_reg_confirmation";
                response_format.platform = payload.source;
                response_format.sessionId = `91${body.PatientPhone}`;
                response_format.messageText = message;
                response_format.message_type = "template";
                await this._platformMessageService.SendMediaMessage(response_format, sendPayload);

            } else if (body.Profile === "Donor") {
                const registerObj = {
                    Phone    : `+91-${body.DonorPhone}`,
                    Password : body.Password
                };

                let apiURL = `donors`;
                const response = await this.needleService.needleRequestForREAN("post", apiURL, null, registerObj);
                const donorUserId = response.Data.Donor.UserId;

                const donorType = body.DonorType === "Bridge Donor" ? "Blood bridge" : "One time";
                const obj = {
                    Gender    : body.DonorGender,
                    FirstName : body.DonorFirstName,
                    LastName  : body.DonorLastName,
                    BirthDate : new Date(body.DonorBirthDate).toISOString()
                        .split('T')[0],
                    BloodGroup       : body.DonorBloodGroup,
                    LastDonationDate : new Date(body.DonorLastDonationDate).toISOString()
                        .split('T')[0],
                    DonorType : donorType,
                };
                apiURL = `donors/${donorUserId}`;
                await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
                const message = `Hi ${body.DonorFirstName}, \nYou have successfully registered with blood warrior team as ${body.DonorType}.`;
                const sendPayload = {};
                sendPayload["variables"] = [
                    {
                        type : "text",
                        text : body.DonorFirstName
                    },
                    {
                        type : "text",
                        text : body.DonorType
                    }];
                sendPayload["templateName"] = "bot_reg_confirmation";
                response_format.platform = payload.source;
                response_format.sessionId = `91${body.DonorPhone}`;
                response_format.messageText = message;
                response_format.message_type = "template";
                await this._platformMessageService.SendMediaMessage(response_format, sendPayload);

            } else if (body.Profile === "Volunteer") {

                const registerObj = {
                    Phone    : `+91-${body.VolunteerPhone}`,
                    Password : body.Password
                };

                let apiURL = `volunteers`;
                const response = await this.needleService.needleRequestForREAN("post", apiURL, null, registerObj);
                const volunteerUserId = response.Data.Volunteer.UserId;
                const obj = {
                    Gender    : body.VolunteerGender,
                    FirstName : body.VolunteerFirstName,
                    BirthDate : new Date(body.VolunteerBirthDate).toISOString()
                        .split('T')[0],
                    BloodGroup : body.VolunteerBloodGroup
                };
                apiURL = `volunteers/${volunteerUserId}`;
                await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
                const sendPayload = {};
                sendPayload["variables"] = [
                    {
                        type : "text",
                        text : body.VolunteerFirstName
                    },
                    {
                        type : "text",
                        text : "volunteer"
                    }];
                sendPayload["templateName"] = "bot_reg_confirmation";
                const message = `Hi ${body.VolunteerFirstName}, \nYou have successfully registered with blood warrior team as volunteer.`;
                response_format.platform = payload.source;
                response_format.sessionId = `91${body.VolunteerPhone}`;
                response_format.messageText = message;
                response_format.message_type = "template";
                await this._platformMessageService.SendMediaMessage(response_format, sendPayload);

            } else if (body.Profile === 'Blood Bridge') {
                let patientUserId = null;
                let donorUserId = null;
                let volunteerUserId = null;
                const bridgeId = body.BridgeId;
                const patientPhone = body.BridgePatientPhone;
                const donorPhone = body.BridgeDonorPhone;
                const volunteerPhone = body.BridgeVolunteerPhone;

                const URL = `patients/search?phone=${patientPhone}`;
                const response = await this.needleService.needleRequestForREAN("get", URL);
                if (response.Data.Patients.Items.length > 0) {
                    patientUserId = response.Data.Patients.Items[0].UserId;
                }
                const patientURL = `patients/${patientUserId}`;
                const response1 = await this.needleService.needleRequestForREAN("get", patientURL);
                const bloodTransfusionDate = response1.Data.Patient.HealthProfile.BloodTransfusionDate;

                const apiURL = `donors/search?phone=${donorPhone}`;
                const result = await this.needleService.needleRequestForREAN("get", apiURL);
                if (result.Data.Donors.Items.length > 0) {
                    donorUserId = result.Data.Donors.Items[0].UserId;
                }

                const apiURL1 = `volunteers/search?phone=${volunteerPhone}`;
                const result1 = await this.needleService.needleRequestForREAN("get", apiURL1);
                if (result1.Data.Volunteers.Items.length > 0) {
                    volunteerUserId = result1.Data.Volunteers.Items[0].UserId;
                }

                const object = {
                    "PatientUserId"    : patientUserId,
                    "DonorUserId"      : donorUserId,
                    "VolunteerUserId"  : volunteerUserId,
                    "Name"             : bridgeId,
                    "DonorType"        : "Blood bridge",
                    "BloodGroup"       : response1.Data.Patient.HealthProfile.BloodGroup,
                    "QuantityRequired" : 1,
                    "NextDonationDate" : bloodTransfusionDate,
                    "LastDonationDate" : result.Data.Donors.Items[0].LastDonationDate,
                    "Status"           : "active"
                };
                const bridgeURL = `clinical/patient-donors`;
                await this.needleService.needleRequestForREAN("post", bridgeURL, null, object);

                const phoneArray = [donorPhone, volunteerPhone];
                const sendPayload = {};
                sendPayload["variables"] = [
                    {
                        type : "text",
                        text : bridgeId
                    }];
                sendPayload["templateName"] = "bridge_confirmation";
                phoneArray.forEach(async (phone) => {
                    const message = `Hi, \nYou have successfully registered with blood bridge ${bridgeId}.\nRegards \nTeam Blood Warriors`;
                    response_format.platform = payload.source;
                    response_format.sessionId = `91${phone}`;
                    response_format.messageText = message;
                    response_format.message_type = "template";
                    await this._platformMessageService.SendMediaMessage(response_format, sendPayload);
                });
                
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

}
