import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { templateButtonService } from '../whatsappmeta.button.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';

@scoped(Lifecycle.ContainerScoped)
export class AcceptDonationRequestService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async sendUserMessage (eventObj) {
        try {
            let donor = null;
            donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

            // Need to correct it for, if same donor present in two bridges
            const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
            const donationRecord = requestBody.Data.Donation.Items[0];
            const dffMessage = `Thank you for accepting the request.`;

            const body : QueueDoaminModel =  {
                Intent : "Update_Accept_Donation_Flags",
                Body   : {
                    EventObj       : eventObj,
                    DonationRecord : donationRecord,
                    DonorUserId    : donor.UserId
                }
            };
            FireAndForgetService.enqueue(body);
            return ( { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'accept blood donation request with patient service error');
        }
    }

    async updateCommunicationDetails (body) {
        try {
            const donationRecord = body.DonationRecord;

            //update donation record with acceptance
            const obj = {
                DonorAcceptedDate : new Date().toISOString()
            };
            await this.bloodWarriorCommonService.updateDonationRecord(donationRecord.id, obj);

            //update donation communication with donor, volunteer userIds
            const bodyObj = {
                PatientUserId    : donationRecord.PatientUserId,
                DonorUserId      : body.DonorUserId,
                VolunteerUserId  : body.DonationRecord.DonationDetails.VolunteerUserId,
                DonationRecordId : donationRecord.id
            };
            console.log(`Update donation communication details ${JSON.stringify(bodyObj)}`);
            await this.bloodWarriorCommonService.updatePatientCommunicationFlags(bodyObj);

            const response_format: Iresponse = commonResponseMessageFormat();
            const payload = body.EventObj.body.originalDetectIntentRequest.payload;
            response_format.platform = payload.source;
            response_format.sessionId = body.EventObj.body.originalDetectIntentRequest.payload.userId;
            this._platformMessageService = body.EventObj.container.resolve(payload.source);
            const templatePayload = {};
            templatePayload["variables"] = [];
            templatePayload["headers"] = {
                "type"  : "image",
                "image" : {
                    "link" : "https://d3uqieugp2i3ic.cloudfront.net/blood_warriors/Blood%20Donation%20Checklist_image.jpg"
                } };
            templatePayload["templateName"] = "checklist_image";
            templatePayload["languageForSession"] = "en";
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, templatePayload);
            delete templatePayload["headers"];
            templatePayload["templateName"] = "donor_checklist_image";
            templatePayload["buttonIds"] = await templateButtonService(["Checklist_Yes","Checklist_No"]);
            await this._platformMessageService.SendMediaMessage(response_format, templatePayload);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'update accept blood donation flags with donor service error');
        }
    }

}
