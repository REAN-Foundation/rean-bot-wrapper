import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import { NeedleService } from '../needle.service.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import type { Iresponse } from '../../refactor/interface/message.interface.js';
import { commonResponseMessageFormat } from '../common.response.format.object.js';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service.js';

@scoped(Lifecycle.ContainerScoped)
export class RegisterAllProfileService {

    private _platformMessageService : platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(ClientEnvironmentProviderService) private clientEnvProviderService?: ClientEnvironmentProviderService,
    ) {}

    async sendUserMessage (eventObj) {
        try {
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = eventObj.container.resolve(payload.source);

            await this.sendUserMessageAfter(eventObj);
            const message = `Hi, You have successfully registered with blood warrior team as patient.`;
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [message] } }] } };
        } catch (err) {
            Logger.instance()
                .log_error(err.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async sendUserMessageAfter(eventObj) {
        try {
            const response_format: Iresponse = commonResponseMessageFormat();
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const body = payload.body;

            if (body.Profile === "Patient") {
                const obj = {
                    Phone      : `+91-${body.PatientPhone}`,
                    Password   : body.Password,
                    Email      : body.PatientEmail,
                    Gender     : body.PatientGender,
                    FirstName  : body.PatientFirstName,
                    LastName   : body.PatientLastName,
                    TenantCode : this.clientEnvProviderService.getClientEnvironmentVariable("NAME"),
                    BirthDate  : new Date(body.PatientBirthDate).toISOString()
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
                sendPayload["languageForSession"] = "en";
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
                sendPayload["languageForSession"] = "en";
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
                sendPayload["languageForSession"] = "en";
                const message = `Hi ${body.VolunteerFirstName}, \nYou have successfully registered with blood warrior team as volunteer.`;
                response_format.platform = payload.source;
                response_format.sessionId = `91${body.VolunteerPhone}`;
                response_format.messageText = message;
                response_format.message_type = "template";
                await this._platformMessageService.SendMediaMessage(response_format, sendPayload);

            } else if (body.Profile === 'Blood Bridge') {
                let patientUserId = null;
                let patientName = null;
                let donorUserId = null;
                let donorName = null;
                let volunteerUserId = null;
                let volunteerName = null;
                const bridgeId = body.BridgeId;
                const patientPhone = body.BridgePatientPhone;
                const donorPhone = body.BridgeDonorPhone;
                const volunteerPhone = body.BridgeVolunteerPhone;

                const URL = `patients/byPhone?phone=${patientPhone}`;
                const response = await this.needleService.needleRequestForREAN("get", URL);
                if (response.Data.Patients.Items.length > 0) {
                    patientUserId = response.Data.Patients.Items[0].UserId;
                    patientName = response.Data.Patients.Items[0].DisplayName;
                }
                const patientURL = `patients/${patientUserId}`;
                const response1 = await this.needleService.needleRequestForREAN("get", patientURL);
                const bloodTransfusionDate = response1.Data.Patient.HealthProfile.BloodTransfusionDate;

                const apiURL = `donors/search?phone=${donorPhone}`;
                const result = await this.needleService.needleRequestForREAN("get", apiURL);
                if (result.Data.Donors.Items.length > 0) {
                    donorUserId = result.Data.Donors.Items[0].UserId;
                    donorName = result.Data.Donors.Items[0].DisplayName;
                }

                const apiURL1 = `volunteers/search?phone=${volunteerPhone}`;
                const result1 = await this.needleService.needleRequestForREAN("get", apiURL1);
                if (result1.Data.Volunteers.Items.length > 0) {
                    volunteerUserId = result1.Data.Volunteers.Items[0].UserId;
                    volunteerName = result1.Data.Volunteers.Items[0].DisplayName;
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

                const sendPayload = {};
                let bridgeDetails = `Bridge Id: *${bridgeId}* \\nPatient Name: *${patientName}* \\nVolunteer Name: *${volunteerName}*`;
                sendPayload["variables"] = [
                    {
                        type : "text",
                        text : donorName
                    },
                    {
                        type : "text",
                        text : bridgeDetails
                    }];
                sendPayload["templateName"] = "bridge_confirmation_donor";
                sendPayload["languageForSession"] = "en";
                const message = `Hi, \nYou have successfully registered with blood bridge ${bridgeId}.\nRegards \nTeam Blood Warriors`;
                response_format.sessionId = `91${donorPhone}`;
                response_format.messageText = message;
                response_format.message_type = "template";
                await this._platformMessageService.SendMediaMessage(response_format, sendPayload);
                bridgeDetails = `Bridge Id: *${bridgeId}*. \\nPatient Name: *${patientName}*, ${patientPhone}. \\nDonor Name: *${donorName}*, ${donorPhone}`;
                sendPayload["variables"] = [
                    {
                        type : "text",
                        text : volunteerName
                    },
                    {
                        type : "text",
                        text : bridgeId
                    },
                    {
                        type : "text",
                        text : bridgeDetails
                    }];
                sendPayload["templateName"] = "bridge_confirmation_volunteer";
                response_format.sessionId = `91${volunteerPhone}`;
                await this._platformMessageService.SendMediaMessage(response_format, sendPayload);
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register all profile with blood warrior service error');
        }
    }

}
