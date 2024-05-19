import { GetPatientInfoService } from '../support.app.service';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { templateButtonService, whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { BloodWarriorWelcomeService } from './welcome.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';

@scoped(Lifecycle.ContainerScoped)
export class NeedBloodService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
        @inject(BloodWarriorWelcomeService) private bloodWarriorWelcomeService?: BloodWarriorWelcomeService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService
    ){}
    
    async triggerNeedBloodEvent (eventObj) {
        // eslint-disable-next-line max-len
        try {
            const roleId = await this.bloodWarriorWelcomeService.getRoleId(eventObj);
            const triggering_event = await this.getEvent(roleId);
            return await this.dialoflowMessageFormattingService.triggerIntent(triggering_event,eventObj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Need blood with messaging service error');
        }
    }

    public getEvent(roleId) {
        const message = {
            "Patient"      : "NeedBlood_Patient_Confirm",
            "Donor"        : "NeedBlood_Donor",
            "System admin" : "BloodWarrior_Admin",
            "Volunteer"    : "Donation_Request"
        };
        return message[roleId] ?? "New_User";
    }

    async needBloodPatientService (eventObj) {
        try {
            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            const patientUserId = result.message[0].UserId;
            const name = result.message[0].DisplayName;

            //get medical details for patient
            const apiURL = `clinical/patient-donors/search?patientUserId=${patientUserId}&onlyElligible=true`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.PatientDonors.Items.length > 0) {

                const bloodBridge = result.Data.PatientDonors.Items[0];

                const apiURL = `volunteers/${bloodBridge.VolunteerUserId}`;
                const response = await this.needleService.needleRequestForREAN("get", apiURL);

                const volunteerName = response.Data.Volunteer.User.Person.DisplayName;
                const volunteerPhone = await this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(
                    response.Data.Volunteer.User.Person.Phone);
                const dffMessage = `Thank you for confirming. We have sent a request to ${volunteerName}.`;
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : { "text": [dffMessage] }
                        }
                    ]
                };

                //Notify to volunteer
                const body : QueueDoaminModel =  {
                    Intent : "NeedBlood_Patient_Confirm_Yes",
                    Body   : {
                        VolunteerPhone : volunteerPhone,
                        VolunteerName  : volunteerName,
                        PatientName    : name,
                        EventObj       : eventObj
                    }
                };
                FireAndForgetService.enqueue(body);
                return { sendDff: true, message: data };
            } else {
                const dffMessage = `Sorry, You are not connected with any blood bridge.`;
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : { "text": [dffMessage] }
                        }
                    ]
                };
                return { sendDff: true, message: data };
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async needBloodNotifyVolunteer (body, eventObj) {
        try {
            const msg = `Hi ${body.VolunteerName}, \n'${body.PatientName}' requires blood. Please confirm with patient and schedule a donation.
            \nRegards \nTeam Blood Warriors`;
            const payload = {};
            payload["buttonIds"] = await templateButtonService(["Schedule_Donation","NeedBlood_Patient_ByMistake"]);

            payload["variables"] = [
                {
                    type : "text",
                    text : body.VolunteerName
                },
                {
                    type : "text",
                    text : body.PatientName
                }];
            payload["templateName"] = "need_blood_notify_volunteer";
            payload["languageForSession"] = "en";
            const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = previousPayload.source;
            response_format.sessionId = body.VolunteerPhone;
            response_format.messageText = msg;
            response_format.message_type = "template";

            this._platformMessageService = eventObj.container.resolve(previousPayload.source);
            const result = await this._platformMessageService.SendMediaMessage(response_format, payload);
            if (result.statusCode === 200 ) {
                console.log(`Succesfully patient(${body.PatientName}) blood requirement notification send to volunteer. Volunteer Name : ${body.VolunteerName}.`);
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

}
