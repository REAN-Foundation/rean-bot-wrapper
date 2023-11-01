/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import path from 'path';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { RaiseDonationRequestService } from './raise.request.service';
import { BloodWarriorCommonService } from './common.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { DateStringFormat, DurationType, TimeHelper } from '../../common/time.helper';
import { AwsS3manager } from '../aws.file.upload.service';
import { generatePdfCertificate } from './generate.pdf.certificate';

@scoped(Lifecycle.ContainerScoped)
export class GenerateCertificateYesService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
    ) {}

    async sendUserMessage (eventObj) {
        try {
            let volunteer = null;
            volunteer = await this.bloodWarriorCommonService.getVolunteerByPhoneNumber(eventObj);

            //load a reminder for volunteer

            //const apiURL = `clinical/donation-communication/search?selectedVolunteerUserId=${volunteer.UserId}`;
            const apiURL = `clinical/donation-communication/search?volunteerUserId=${volunteer.UserId}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL);
            //const donorUserId = requestBody.Data.DonationCommunication.Items[0].AcceptedDonorUserId;
            const donorUserId = requestBody.Data.DonationCommunication.Items[0].DonorUserId;
            const donor = await this.bloodWarriorCommonService.getDonorPhoneByUserId(donorUserId);
            const dffMessage = `Thank you for your confirmation, ${volunteer.DisplayName}. \nA certificate of recognition is generated and sent to ${donor.User.Person.DisplayName}`;

            //Send certificate to donor and notify patient
            const body : QueueDoaminModel =  {
                Intent : "Generate_Certificate_Yes",
                Body   : {
                    EventObj      : eventObj,
                    PatientUserId : requestBody.Data.DonationCommunication.Items[0].PatientUserId,
                    VolunteerName : volunteer.DisplayName,
                    Donor         : donor
                }
            };
            FireAndForgetService.enqueue(body);
            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Raise blood donation request with blood warrior service error');
        }
    }

    async generateCertificateForDonor(body) {
        try {

            //message send to donor
            const payload = body.EventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = body.EventObj.container.resolve(payload.source);
            const nextDonationDate = await this.getNextEligibleDonationDate(body.Donor.LastDonationDate, body.Donor.User.Person.Gender);
            const donorPhone = this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(body.Donor.User.Person.Phone);
            const donorMessage = `Your donation is confirmed and we are thankful for your support, ${body.Donor.User.Person.DisplayName}
            \nAs a token of gratitude, here is a certificate that you can proudly share with your network.
            \nYou are next eligible for donation on ${nextDonationDate}`;
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = payload.source;
            response_format.sessionId = donorPhone;
            response_format.messageText = donorMessage;
            response_format.message_type = "text";
            await this._platformMessageService.SendMediaMessage(response_format, null);

            //Certificate message to donor

            const filePath = await generatePdfCertificate(body.Donor.User.Person.DisplayName, body.Donor.LastDonationDate );
            const bucket_name = process.env.TEMP_BUCKET_NAME;
            const cloud_front_path = process.env.TEMP_CLOUD_FRONT_PATH;
            const file_url = await this.awsS3manager.uploadFileToS3(filePath, bucket_name, cloud_front_path);
            console.log(`file location of BW ${file_url}`);
            const certificateMessage = `CERTIFICATE IS SENT AFTER BW VOLUNTEER CONFIRMS DONATION
            \nDONATION IS ALSO TRACKED AUTOMATICALLY AFTER BW VOLUNTEER CONFIRMS
            \nELIGIBLE DATE = ${nextDonationDate}
            \nAlso track donation mapped to the patient`;
            response_format.messageText = certificateMessage;
            await this._platformMessageService.SendMediaMessage(response_format, null);

            //message send to patient

            //here load patient 2nd reminder to ask whether donation has completed or not
            const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(body.PatientUserId);
            const patientPhone =
                this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patient.User.Person.Phone);
            const patientMessage = `Dear ${patient.User.Person.DisplayName},
            Donation by ${body.Donor.User.Person.DisplayName} is successfully complete. You can now book your transfusion.`;
            response_format.platform = payload.source;
            response_format.sessionId = patientPhone;
            response_format.messageText = patientMessage;
            response_format.message_type = "text";
            await this._platformMessageService.SendMediaMessage(response_format, null);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }

    }

    async getNextEligibleDonationDate(donationDate, donorGender) {
        try {
            let nextDoantionDate = new Date(donationDate);
            if (donorGender === 'Male' ) {
                nextDoantionDate = TimeHelper.addDuration(new Date(donationDate), 90, DurationType.Day);
                return TimeHelper.getDateString(nextDoantionDate, DateStringFormat.YYYY_MM_DD);
            }
            else if (donorGender === 'Female' ) {
                nextDoantionDate = TimeHelper.addDuration(new Date(donationDate), 100, DurationType.Day);
                return TimeHelper.getDateString(nextDoantionDate, DateStringFormat.YYYY_MM_DD);
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'get elligible next donation date service error');
        }
    }

}
