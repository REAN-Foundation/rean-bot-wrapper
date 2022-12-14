import { ScheduleDonationTakeValuesService } from "../../../services/bloodWrrior/schedule.donationtake.values.service";

export const ScheduleDonationTakeValues = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await ScheduleDonationTakeValuesService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
