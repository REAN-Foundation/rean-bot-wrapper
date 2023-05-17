import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { BloodWarriorCommonService } from './common.service';
import { GetPatientInfoService } from '../support.app.service';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { RaiseDonationRequestService } from './raise.request.service';
import { commonResponseMessageFormat } from '../common.response.format.object';

@scoped(Lifecycle.ContainerScoped)
export class FeelingUnwellService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService
    ){}

    async sendMeassageToPatient(eventObj){
        try {
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            const patientUserId = result.message[0].UserId;
            const name = result.message[0].DisplayName;
            const dffMessage = `We will notify your volunteer to contact you. \n\nRegards \nTeam Blood Warriors.`;

            const apiURL = `patient-health-profiles/${patientUserId}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            const transfusionDate = result.Data.HealthProfile.BloodTransfusionDate;
            const stringTFDate = new Date(transfusionDate).toDateString();
            return { sendDff         : true,
                message         : { fulfillmentMessages: [{ text: { text: [dffMessage] } }] },
                patientUserId   : patientUserId,
                name            : name,
                transfusionDate : stringTFDate };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

    async notifyVolunteer (eventObj, patientUserId, patientName, transfusionDate) {
        try {
            let result = null;
            const apiURL = `clinical/patient-donors/search?patientUserId=${patientUserId}&onlyElligible=true`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {

                const bloodBridge = result.Data.PatientDonors.Items[0];

                const apiURL = `volunteers/${bloodBridge.VolunteerUserId}`;
                const response = await this.needleService.needleRequestForREAN("get", apiURL);

                const volunteerName = response.Data.Volunteer.User.Person.DisplayName;
                let volunteerPhone = response.Data.Volunteer.User.Person.Phone;
                
                const msg = `Hi ${volunteerName}, \n${patientName} is not feeling well and has a transfusion date on ${transfusionDate}. Could you please follow up with them? \nRegards \nTeam Blood Warriors`;
                const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
                volunteerPhone = this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteerPhone);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.platform = previousPayload.source;
                response_format.sessionId = volunteerPhone;
                response_format.messageText = msg;
                response_format.message_type = "text";

                const previousIntentPayload = eventObj.body.originalDetectIntentRequest.payload;
                this._platformMessageService = eventObj.container.resolve(previousIntentPayload.source);
                await this._platformMessageService.SendMediaMessage(response_format, null);
                if (result.statusCode === 200 ) {
                    console.log(`Succesfully patient unwell health notification send to volunteer. Volunteer Name : ${volunteerName}.`);
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
