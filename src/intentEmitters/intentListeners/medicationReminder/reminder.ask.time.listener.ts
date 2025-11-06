import { ReminderAskTimeService } from "../../../services/reminder/reminder.ask.time.service.js";

export const ReminderAskTimeListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const reminderAskTimeService: ReminderAskTimeService = eventObj.container.resolve(ReminderAskTimeService);
    try {
        let result = null;
        result = await reminderAskTimeService.createReminder(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
