import { ScheduleDonationElligibleService } from "../../../services/bloodWrrior/schedule.donation.elligible.service";

export const ScheduleDonationElligible = async (intent, eventObj) => {
    const scheduleDOnationElligibleService = eventObj.container.resolve(ScheduleDonationElligibleService);
    try {
        let result = null;
        result = await scheduleDOnationElligibleService.ScheduleDonationElligible(eventObj);
        console.log("fullfillment object", result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
