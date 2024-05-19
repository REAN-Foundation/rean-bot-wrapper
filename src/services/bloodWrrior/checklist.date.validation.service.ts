import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { container, inject, Lifecycle, scoped } from 'tsyringe';
import { RaiseDonationRequestService } from './raise.request.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';

@scoped(Lifecycle.ContainerScoped)
export class ChecklistDateValidationService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    checklistDateValidationService = async (eventObj) => {
        try {
            const transfusionDate = eventObj.body.queryResult.parameters.date;
            let donor = null;
            donor = await this.bloodWarriorCommonService.getDonorByPhoneNumber(eventObj);

            const apiURL = `clinical/donation-record/search?donorUserId=${donor.UserId}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
            const donationDate = requestBody.Data.Donation.Items[0].DonationDetails.NextDonationDate;
            const volunteerUserId = requestBody.Data.Donation.Items[0].DonationDetails.VolunteerUserId;
            const patientUserId = requestBody.Data.Donation.Items[0].DonationDetails.PatientUserId;
            const requestedQuantity = requestBody.Data.Donation.Items[0].DonationDetails.QuantityRequired;
            let dffMessage = "";
            // eslint-disable-next-line max-len
            const daydifference = await this.bloodWarriorCommonService.differenceBetweenTwoDates(new Date(donationDate), new Date(transfusionDate));
            if (daydifference >= 0 && daydifference < 5) {
                dffMessage = `Date Validation Success. \nHere are your donation details.`;

                const stringTransfusionDate = new Date(transfusionDate.split("T")[0]).toDateString();
                const userMessage = ` *Donor Name:* ${donor.DisplayName}, \n *Blood Group:* ${donor.BloodGroup}, \n *Required Quantity:* ${requestedQuantity} unit, \n *Donation Date:* ${stringTransfusionDate}`;

                const body : QueueDoaminModel =  {
                    Intent : "Checklist_Yes_Date",
                    Body   : {
                        EventObj              : eventObj,
                        TransfusionDate       : transfusionDate,
                        Donor                 : donor,
                        RequestedQuantity     : requestedQuantity,
                        StringTransfusionDate : stringTransfusionDate,
                        PatientUserId         : patientUserId,
                        VolunteerUserId       : volunteerUserId,
                        DonationRecord        : requestBody.Data.Donation.Items[0]
                    }
                };
                FireAndForgetService.enqueue(body);
                dffMessage = dffMessage + '\n' + userMessage;

            } else {
                dffMessage = "The donation date you entered is not correct please try again.";
            }
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Checklist date validation by donor service error');
        }
    };

    public async sendConfirmationMessage(eventObj: any, transfusionDate: any, donor: any,requestedQuantity: any,
        stringTransfusionDate: string, patientUserId: any, volunteerUserId: any, body ) {
        const intentPayload = eventObj.body.originalDetectIntentRequest.payload;
        this._platformMessageService = eventObj.container.resolve(intentPayload.source);
        const heading = `Here are the details of the confirmed donor`;

        //Fetch donation reminders for donors
        if (transfusionDate) {
            transfusionDate = new Date(transfusionDate.split("T")[0]);

            //donationDate.setDate(donationDate.getDate() - 1);
        }
        await this.bloodWarriorCommonService.fetchDonorDonationReminders(donor.UserId, transfusionDate);

        //Template message formation
        const payload = {};
        payload["variables"] = [
            {
                type : "text",
                text : donor.DisplayName
            },
            {
                type : "text",
                text : donor.BloodGroup
            },
            {
                type : "text",
                text : requestedQuantity
            },
            {
                type : "text",
                text : stringTransfusionDate
            }
        ];
        payload["templateName"] = "donor_confirmation_msg";
        payload["languageForSession"] = "en";

        //update donation communication with donor, volunteer userIds
        const bodyObj = {
            DonationDate : stringTransfusionDate,
            DonationType : "Blood bridge"
        };
        await this.bloodWarriorCommonService.updateDonationRecord( body.DonationRecord.id, bodyObj);

        //message send to patient
        const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(patientUserId);
        const patientPhone =
            this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patient.User.Person.Phone);
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = intentPayload.source;
        response_format.sessionId = patientPhone;
        response_format.messageText = heading;
        response_format.message_type = "template";
        await this._platformMessageService.SendMediaMessage(response_format, payload);

        //message send to volunteer
        const volunteer = await this.bloodWarriorCommonService.getVolunteerPhoneByUserId(volunteerUserId);
        const volunteerPhone =
            this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(volunteer.User.Person.Phone);
        response_format.sessionId = volunteerPhone;
        response_format.messageText = heading;
        response_format.message_type = "template";
        await this._platformMessageService.SendMediaMessage(response_format, payload);
    }

}
