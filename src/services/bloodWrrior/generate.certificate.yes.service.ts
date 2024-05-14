/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
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
                    EventObj         : eventObj,
                    PatientUserId    : requestBody.Data.DonationCommunication.Items[0].PatientUserId,
                    DonationRecordId : requestBody.Data.DonationCommunication.Items[0].DonationRecordId,
                    VolunteerName    : volunteer.DisplayName,
                    VolunteerUserId  : volunteer.UserId,
                    Donor            : donor
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
            const payload = body.EventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = body.EventObj.container.resolve(payload.source);
            const nextDonationDate = await this.getNextEligibleDonationDate(body.Donor.LastDonationDate, body.Donor.User.Person.Gender);
            const donorPhone = this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(body.Donor.User.Person.Phone);

            // const donorMessage = `Your donation is confirmed and we are thankful for your support, ${body.Donor.User.Person.DisplayName}
            // \nAs a token of gratitude, here is a certificate that you can proudly share with your network.
            // \nYou are next eligible for donation on ${nextDonationDate}`;
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = payload.source;
            response_format.sessionId = donorPhone;

            //Certificate message to donor
            const donorName = body.Donor.User.Person.DisplayName;
            const filePath = await generatePdfCertificate(donorName, body.Donor.LastDonationDate );
            const bucket_name = process.env.TEMP_BUCKET_NAME;
            const cloud_front_path = process.env.TEMP_CLOUD_FRONT_PATH;

            const file_url = await this.awsS3manager.uploadFileToS3(filePath, bucket_name, cloud_front_path);
            console.log(`file location of BW ${file_url}`);

            const cirtificatePayload = {};
            cirtificatePayload["variables"] = [
                {
                    type : "text",
                    text : body.Donor.User.Person.DisplayName
                },
                {
                    type : "text",
                    text : nextDonationDate
                }];
            cirtificatePayload["headers"] = { link: file_url };
            cirtificatePayload["templateName"] = "generate_certificate_yes_donor_1";
            cirtificatePayload["languageForSession"] = "en";
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, cirtificatePayload);

            //load patient 2nd reminder to ask whether donation has completed or not
            const reminderDate = TimeHelper.addDuration(new Date(body.Donor.LastDonationDate), 5, DurationType.Day);
            const apiURL = `care-plans/patients/${body.PatientUserId}/enroll`;
            const obj = {
                Provider  : "REAN_BW",
                PlanName  : "Patient donation confirmation message",
                PlanCode  : "Patient-Donation-Confirmation",
                StartDate : reminderDate.toISOString().split('T')[0]
            };
            await this.needleService.needleRequestForREAN("put", apiURL, null, obj);

            //load volunteer reminder to ask whether donation has completed or not
            const enrollURL = `care-plans/patients/${body.VolunteerUserId}/enroll`;
            obj.PlanCode = "Volunteer-Donation-Confirmation";
            obj.PlanName = "Volunteer donation confirmation";
            await this.needleService.needleRequestForREAN("put", enrollURL, null, obj);

            //message send to patient
            const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(body.PatientUserId);
            const patientPhone =
                this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patient.User.Person.Phone);
            const patientMessage = `Dear ${patient.User.Person.DisplayName},
            Donation by ${body.Donor.User.Person.DisplayName} is successfully complete. You can now book your transfusion.`;

            const templatePayload = {};
            templatePayload["variables"] = [
                {
                    type : "text",
                    text : patient.User.Person.DisplayName
                },
                {
                    type : "text",
                    text : body.Donor.User.Person.DisplayName
                }];
            templatePayload["templateName"] = "generate_certificate_yes_patient";
            templatePayload["languageForSession"] = "en";
            response_format.platform = payload.source;
            response_format.sessionId = patientPhone;
            response_format.messageText = patientMessage;
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, templatePayload);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Generate certificate for selected donor service error');
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
