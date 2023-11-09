import { ReminderRegistrationService } from "../../../services/reminder/reminder.registration.service";

export const ReminderRegistrationListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const reminderRegistrationService: ReminderRegistrationService = eventObj.container.resolve(ReminderRegistrationService);
    try {
        let result = null;
        result = await reminderRegistrationService.setUserTimeZone(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
