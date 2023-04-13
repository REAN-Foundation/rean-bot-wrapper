import { ScheduleDonationService } from "../../../services/bloodWrrior/schedule.donation.service";

export const ScheduleDonation = async (intent, eventObj) => {
    const scheduleDonationService = eventObj.container.resolve(ScheduleDonationService); 
    try {
        let result = null;
        result = await scheduleDonationService.ScheduleDonation(eventObj);
        console.log(result);
        return result.message;
    } catch (error) {
        console.log(error);
    }
};
