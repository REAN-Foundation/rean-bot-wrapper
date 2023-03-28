import { ScheduleOneTimeTakeValuesService } from "../../../services/bloodWrrior/schedule.one.time.take.values.service";

export const ScheduleOneTimeTakeValuesListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        // eslint-disable-next-line max-len
        const scheduleOneTimeTakeValuesService: ScheduleOneTimeTakeValuesService = eventObj.container.resolve(ScheduleOneTimeTakeValuesService);
        try {
            let result = null;
            result = await scheduleOneTimeTakeValuesService.ScheduleOneTimeTakeValues(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
