import { ScheduleDonationService } from "../../../services/bloodWrrior/schedule.donation.service";

export const ScheduleDonation = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await ScheduleDonationService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
