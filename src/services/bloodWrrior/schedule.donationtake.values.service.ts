import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { BloodWarriorCommonService } from './common.service';
import { RaiseDonationRequestService } from './raise.request.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';

@scoped(Lifecycle.ContainerScoped)
export class ScheduleDonationTakeValuesService {

    constructor(
        @inject(RaiseDonationRequestService) private raiseDonationRequestService?: RaiseDonationRequestService,
        @inject(BloodWarriorCommonService) private bloodWarriorCommonService?: BloodWarriorCommonService,
        @inject(NeedleService) private needleService?: NeedleService,
        private _platformMessageService?: platformServiceInterface,
    ) {}

    async ScheduleDonationTakeValuesService(eventObj){
        return new Promise(async (resolve) => {
            try {
                const bridgeId = eventObj.body.queryResult.parameters.bridge_Id;
                const phoneNumber = eventObj.body.queryResult.parameters.phoneNumber;
                const donation_Date = eventObj.body.queryResult.parameters.donation_Date;
                const location = eventObj.body.queryResult.parameters.location;
                console.log(`TAKE value phonenumber is ${phoneNumber}`);
                let result = null;
                let dffMessage = "";
                const apiURL = `clinical/patient-donors/search?name=${bridgeId}&onlyElligible=true`;
                result = await this.needleService.needleRequestForREAN("get", apiURL);
    
                //We need to iterate here if i want to send reminders to all donors having same blood bridge
                if (result.Data.PatientDonors.Items.length > 0) {
                    const patientDonors = result.Data.PatientDonors.Items[0];
                    let lastDonationDate = patientDonors.LastDonationDate ?? null;
                    if (lastDonationDate) {
                        lastDonationDate = new Date(lastDonationDate.split("T")[0]).toDateString();
                    }
                    // eslint-disable-next-line max-len
                    const patient = await this.bloodWarriorCommonService.getPatientPhoneByUserId(patientDonors.PatientUserId);
                    const obj = {
                        PatientUserId     : patientDonors.PatientUserId,
                        NetworkId         : patientDonors.id,
                        RequestedQuantity : 1,
                        RequestedDate     : new Date().toISOString()
                            .split('T')[0]
                    };
    
                    //yaha pe pehle donation record nikalo from db agar nahi mile to create new one
                    await this.raiseDonationRequestService.createDonationRecord(obj);
                    dffMessage = `Congratulations! \nThe donation has been successfully scheduled.`;
                    const commonMessage = `
                Donor name: ${patientDonors.DonorName},
                Blood Group: ${patientDonors.BloodGroup},
                Date: ${new Date(donation_Date.split("T")[0]).toDateString()},
                Donation Type: ${patientDonors.DonorType},
                Patient name: ${patient.User.Person.DisplayName},
                Maps: ${location}`;
                    resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage + commonMessage] } }] } });
    
                    //Fetch donation reminders for donors
                    const nextDonationDate = new Date(donation_Date.split("T")[0]);
                    // eslint-disable-next-line max-len
                    await this.bloodWarriorCommonService.fetchDonorDonationReminders(patientDonors.DonorUserId,nextDonationDate);
    
                    //Message sent to patient
                    const heading = `Hi ${patient.User.Person.DisplayName}, `;
                    const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
                    const patientPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patient.User.Person.Phone);
                    const payload = {};
                    payload["variables"] = [
                        {
                            type : "text",
                            text : patientDonors.DonorName
                        },
                        {
                            type : "text",
                            text : patientDonors.BloodGroup
                        },
                        {
                            type : "text",
                            text : new Date(donation_Date.split("T")[0]).toDateString()
                        },
                        {
                            type : "text",
                            text : location
                        },
                        {
                            type : "text",
                            text : patient.User.Person.DisplayName
                        },
                        {
                            type : "text",
                            text : patientDonors.DonorType
                        }];
                    payload["templateName"] = "patient_volunteer_donation_update";
                    const response_format: Iresponse = commonResponseMessageFormat();
                    response_format.platform = previousPayload.source;
                    response_format.sessionId = patientPhone;
                    response_format.messageText = heading + dffMessage + commonMessage;
                    response_format.message_type = "template";
                    await this._platformMessageService.SendMediaMessage(response_format, payload);
    
                    //Message sent to donor
                    const heading1 = `Hi ${patientDonors.DonorName}, \nThe donation request has been created by volunteer.`;
                    const donorPhone =
                        this.raiseDonationRequestService.convertPhoneNoReanToWhatsappMeta(patientDonors.DonorPhone);
                    response_format.sessionId = donorPhone;
                    response_format.messageText = heading1 + commonMessage;
                    response_format.message_type = "text";
                    await this._platformMessageService.SendMediaMessage(response_format, null);
                } else {
                    dffMessage = `Sorry for the inconvenience, something went wrong.`;
                    resolve( { message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } });
                }
                
            } catch (error) {
                Logger.instance()
                    .log_error(error.message,500,'Schedule donation service error');
            }
        });
    }

}

