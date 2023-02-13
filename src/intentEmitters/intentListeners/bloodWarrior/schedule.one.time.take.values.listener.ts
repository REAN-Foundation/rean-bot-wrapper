import { ScheduleOneTimeTakeValuesService } from "../../../services/bloodWrrior/schedule.one.time.take.values.service";

export const ScheduleOneTimeTakeValuesListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await ScheduleOneTimeTakeValuesService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
