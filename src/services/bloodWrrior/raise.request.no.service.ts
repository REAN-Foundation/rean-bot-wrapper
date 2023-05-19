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
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
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
                payload["templateName"] = "patient_fifthday_rejected_volunteer";
                payload["languageForSession"] = "en";

                const previousIntentPayload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = eventObj.container.resolve(previousIntentPayload.source);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = previousIntentPayload.source;
                response_format.sessionId = volunteerPhone;
                response_format.messageText = null;
                response_format.message_type = "template";
                result = await this._platformMessageService.SendMediaMessage(response_format, payload);
                if (result.statusCode === 200 ) {
                    console.log(`Succesfully patient rejection notification send to volunteer. Volunteer Name : ${volunteerName}.`);
                }
            }

            // Update patient commnication flags (fifth reminder)
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
