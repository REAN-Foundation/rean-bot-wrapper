import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService, templateButtonService } from '../whatsappmeta.button.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { BloodWarriorCommonService } from './common.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { TimeHelper } from '../../common/time.helper';

@scoped(Lifecycle.ContainerScoped)
export class GenerateCertificateService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async sendUserMessage (eventObj) {
        try {
            let donor = null;
            donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

            const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
            const donationRecord = requestBody.Data.DonationRecord.Items[0];

            // if (donor.DonorType === 'One time') {
            //     volunteerUserId = requestBody.Data.DonationRecord.Items[0].VolunteerOfEmergencyDonor;
            // } else {
            const volunteerUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.VolunteerUserId;
            const patientUserId = requestBody.Data.DonationRecord.Items[0].DonationDetails.PatientUserId;
    
            // }
            const dffMessage = `Thank you for confirming. You are a real life Super Hero helping save lives. \nRegards \nTeam Blood Warriors`;

            //Inform volunteer to generate certificate
            const body : QueueDoaminModel =  {
                Intent : "Generate_Certificate_Inform_Volunteer",
                Body   : {
                    EventObj        : eventObj,
                    VolunteerUserId : volunteerUserId,
                    PatientUserId   : patientUserId,
                    DonationRecord  : donationRecord,
                    Donor           : donor
                }
            };
            FireAndForgetService.enqueue(body);
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Generate certificate start with donor service error');
        }
    }

    async generateCertificateInformVolunteer(body) {
        try {
            const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(body.PatientUserId);
            const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(body.VolunteerUserId);

            //message send to volunteer
            const payload = body.EventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = body.EventObj.container.resolve(payload.source);
            const volunteerPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
            const donationDate =
                await TimeHelper.formatDateToLocal_YYYY_MM_DD(new Date(body.DonationRecord.DonorAcceptedDate));
            const message = `Hey ${volunteer.User.Person.DisplayName},
            ${body.Donor.DisplayName} has confirmed that he/she has donated for ${patient.User.Person.DisplayName} on ${donationDate}. Please re-confirm:`;

            // Meta template message creation
            const templatePayload = {};
            templatePayload["buttonIds"] = await templateButtonService(["Generate_Certificate_Yes","Generate_Certificate_No"]);
            templatePayload["variables"] = [
                {
                    type : "text",
                    text : volunteer.User.Person.DisplayName
                },
                {
                    type : "text",
                    text : body.Donor.DisplayName
                },
                {
                    type : "text",
                    text : patient.User.Person.DisplayName
                },
                {
                    type : "text",
                    text : donationDate
                }];
            templatePayload["templateName"] = "generate_certificate_notify_volunteer";
            templatePayload["languageForSession"] = "en";


            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = payload.source;
            response_format.sessionId = volunteerPhone;
            response_format.messageText = message;
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, templatePayload);

            // Update donor last donation date
            const apiURL = `donors/${body.PatientUserId}`;
            const obj = {
                Provider  : "REAN_BW",
                PlanName  : "Patient donation confirmation message",
                PlanCode  : "Patient-Donation-Confirmation",
                StartDate : new Date().toISOString().split('T')[0]
            };
            await this.needleService.needleRequestForREAN("put", apiURL, null, obj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Generate certificate notify volunteer service error');
        }
    }

}
