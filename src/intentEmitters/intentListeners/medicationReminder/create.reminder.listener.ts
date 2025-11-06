import { CreateReminderService } from "../../../services/reminder/create.reminder.service.js";

export const CreateReminderListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const createReminderService: CreateReminderService = eventObj.container.resolve(CreateReminderService);
    try {
        let result = null;
        result = await createReminderService.createReminder(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
