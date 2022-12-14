import { ScheduleDonationElligibleService } from "../../../services/bloodWrrior/schedule.donation.elligible.service";

export const ScheduleDonationElligible = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await ScheduleDonationElligibleService(eventObj);
            console.log("fullfillment object", result);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
