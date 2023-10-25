import { GeneralReminderService } from "../../../services/reminder/general.reminder.service";

export const GeneralReminderListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const generalReminderService: GeneralReminderService = eventObj.container.resolve(GeneralReminderService);
    try {
        let result = null;
        result = await generalReminderService.createReminder(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
