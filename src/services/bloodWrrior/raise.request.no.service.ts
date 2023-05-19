import { GetPatientInfoService } from '../support.app.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { BloodWarriorCommonService } from './common.service';
import { RaiseDonationRequestService } from './raise.request.service';

@scoped(Lifecycle.ContainerScoped)
export class RaiseDonationRequestNoService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor (
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
    ) {}

    async sendRejectionMessage (eventObj) {
        try {
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            const patientUserId = result.message[0].UserId;
            const name = result.message[0].DisplayName;

            const apiURL = `patient-health-profiles/${patientUserId}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            const transfusionDate = result.Data.HealthProfile.BloodTransfusionDate;
            const stringTFDate = new Date(transfusionDate).toDateString();
            const dffMessage = `Hi ${name}, \n\nThank you for the confirmation. If you like to raise a request, just send *Need Blood*. \n\nRegards \nTeam Blood Warriors.`;
            return { sendDff         : true,
                message         : { fulfillmentMessages: [{ text: { text: [dffMessage] } }] },
                patientUserId   : patientUserId,
                name            : name,
                transfusionDate : stringTFDate };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Blood donation rejection service error');
        }
    }

    async patientRejectionNotifyVolunteer (eventObj, patientUserId, patientName, transfusionDate) {
        try {
            let result = null;
            const apiURL = `clinical/patient-donors/search?patientUserId=${patientUserId}&onlyElligible=true`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {

                const bloodBridge = result.Data.PatientDonors.Items[0];

                const apiURL = `volunteers/${bloodBridge.VolunteerUserId}`;
                const response = await this.needleService.needleRequestForREAN("get", apiURL);

                const volunteerName = response.Data.Volunteer.User.Person.DisplayName;
                const volunteerPhone = await this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(
                    response.Data.Volunteer.User.Person.Phone);

                const payload = {};
                payload["languageForSession"] = "en";
                payload["templateName"] = "patient_fifthday_rejected_volunteer";
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
                        text : transfusionDate
                    }];
                const intentOldPayload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = eventObj.container.resolve(intentOldPayload.source);
                const body_response: Iresponse = commonResponseMessageFormat();
                body_response.message_type = "template";
                body_response.platform = intentOldPayload.source;
                body_response.messageText = null;
                body_response.sessionId = volunteerPhone;
                result = await this._platformMessageService.SendMediaMessage(body_response, payload);
                if (result.statusCode === 200 ) {
                    console.log(`Succesfully patient rejection notification send to volunteer. Volunteer Name : ${volunteerName}.`);
                }
            }
            const body = {
                PatientUserId        : patientUserId,
                FifthDayReminderFlag : false
            };
            await this.bloodWarriorCommonService.updatePatientCommunicationFlags(body);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to notify volunteers about donor request');
        }
    }

}
