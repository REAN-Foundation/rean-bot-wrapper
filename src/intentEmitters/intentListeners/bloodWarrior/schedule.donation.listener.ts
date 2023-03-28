import { ScheduleDonationService } from "../../../services/bloodWrrior/schedule.donation.service";

export const ScheduleDonation = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        const scheduleDonationService = eventObj.container.resolve(ScheduleDonationService); 
        try {
            let result = null;
            result = await scheduleDonationService.ScheduleDonation(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
