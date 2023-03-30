import { ScheduleDonationTakeValuesService } from "../../../services/bloodWrrior/schedule.donationtake.values.service";

export const ScheduleDonationTakeValues = async (intent, eventObj) => {
    const scheduleDonationTakeValuesService = eventObj.container.resolve(ScheduleDonationTakeValuesService);
    try {
        let result = null;
        result = await scheduleDonationTakeValuesService.ScheduleDonationTakeValues(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
