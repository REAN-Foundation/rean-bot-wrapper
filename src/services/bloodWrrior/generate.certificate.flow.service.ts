import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import { NeedleService } from '../needle.service.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { templateButtonService } from '../whatsappmeta.button.service.js';
import { RaiseDonationRequestService } from './raise.request.service.js';
import { BloodWarriorCommonService } from './common.service.js';
import type { Iresponse } from '../../refactor/interface/message.interface.js';
import { commonResponseMessageFormat } from '../common.response.format.object.js';
import type { QueueDoaminModel } from '../fire.and.forget.service.js';
import { FireAndForgetService } from '../fire.and.forget.service.js';
import { TimeHelper } from '../../common/time.helper.js';
import { CacheMemory } from '../cache.memory.service.js';

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
            const donationRecord = requestBody.Data.Donation.Items[0];

            // if (donor.DonorType === 'One time') {
            //     volunteerUserId = requestBody.Data.Donation.Items[0].VolunteerOfEmergencyDonor;
            // } else {
            const volunteerUserId = requestBody.Data.Donation.Items[0].DonationDetails.VolunteerUserId;
            const patientUserId = requestBody.Data.Donation.Items[0].DonationDetails.PatientUserId;

            // }
            const dffMessage = `Thank you for confirming. You are a real life Super Hero helping save lives. \nRegards \nTeam Blood Warriors`;

            //Set donation record to cache memory
            const key = `${volunteerUserId}:DonationRecord`;
            CacheMemory.set(key, donationRecord);

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
                await TimeHelper.formatDateToLocal_YYYY_MM_DD(new Date(body.DonationRecord.DonationDate));
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

            // Update donor last donation date of donor
            const apiURL = `donors/${body.Donor.UserId}`;
            const obj = {
                LastDonationDate : donationDate
            };
            await this.needleService.needleRequestForREAN("put", apiURL, null, obj);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Generate certificate notify volunteer service error');
        }
    }

}
