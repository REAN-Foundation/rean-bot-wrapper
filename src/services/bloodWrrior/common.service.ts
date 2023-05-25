import { inject, Lifecycle, scoped } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';

@scoped(Lifecycle.ContainerScoped)
export class BloodWarriorCommonService {

    constructor(
        @inject(NeedleService) private needleService: NeedleService
    ){}

    async getDonorByPhoneNumber (eventObj) {
        try {
            let result = null;
            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);
            const apiURL = `donors/search?phone=${phoneNumber}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.Donors.Items.length > 0) {
                return result.Data.Donors.Items[0];
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Not able to fetch donor by phone number');
        }
    }

    async getVolunteerByPhoneNumber (eventObj) {
        try {
            let result = null;
            const phoneNumber = await this.needleService.getPhoneNumber(eventObj);
            const apiURL = `volunteers/search?phone=${phoneNumber}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            if (result.Data.Volunteers.Items.length > 0) {
                return result.Data.Volunteers.Items[0];
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Not able to fetch volunteer by phone number');
        }
    }

    async getDonorPhoneByUserId (donorUserId: string) {
        try {
            let result = null;
            const apiURL = `donors/${donorUserId}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            return result.Data.Donor;
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Not able to fetch donor by user id');
        }
    }

    async getVolunteerPhoneByUserId (volunteerUserId: string) {
        try {
            let result = null;
            const apiURL = `volunteers/${volunteerUserId}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            return result.Data.Volunteer;
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Not able to fetch volunteer by user id');
        }
    }

    async getPatientPhoneByUserId (patientUserId: string) {
        try {
            let result = null;
            const apiURL = `patients/${patientUserId}`;
            result = await this.needleService.needleRequestForREAN("get", apiURL);
            return result.Data.Patient;
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Not able to fetch volunteer by user id');
        }
    }

    async updateDonationRecord (donationRecordId: string, obj: any) {
        try {
            const apiURL = `clinical/donation-record/${donationRecordId}`;
            await this.needleService.needleRequestForREAN("put", apiURL, null, obj);
            console.log(`Succesfully updated donation record.`);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to create donation record');
        }
    }

    async fetchDonorDonationReminders (donorUserId: string, bloodTransfusionDate: Date ) {
        try {
            let result = null;
            const url = `care-plans/patients/${donorUserId}/enroll`;
            const obj = {
                Provider  : "REAN_BW",
                PlanName  : "Donor messages",
                PlanCode  : "Donor-Reminders",
                StartDate : bloodTransfusionDate.toISOString().split("T")[0]
            };
            result = await this.needleService.needleRequestForREAN("post", url, null, obj);
            if (result.HttpCode === 201) {
                console.log(`Succesfully fetched donation reminders for donoR user Id ${donorUserId}`);

            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to create donation record');
        }
    }

    async differenceBetweenTwoDates (date_2 :Date, date_1 :Date ) : Promise<number> {
        try {
            const difference = date_2.getTime() - date_1.getTime();
            const TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
            return TotalDays;

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to calculate day difference');
        }
    }

    async updatePatientCommunicationFlags (obj: any) {
        try {
            const apiURL = `clinical/donation-communication`;
            await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
            console.log(`Succesfully updated donation communication flags.`);

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Failed to updated donation communication flags.');
        }
    }

}
