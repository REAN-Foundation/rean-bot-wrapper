import { ScheduleDonationTakeValuesService } from "../../../services/bloodWrrior/schedule.donationtake.values.service";

export const ScheduleDonationTakeValues = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        const scheduleDonationTakeValuesService = eventObj.container.resolve(ScheduleDonationTakeValuesService);
        try {
            let result = null;
            result = await scheduleDonationTakeValuesService.ScheduleDonationTakeValues(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
