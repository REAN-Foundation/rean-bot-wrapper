import { DeleteReminderService } from "../../../services/reminder/delete.reminder.service.js";

export const DeleteReminderListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const deleteReminderService: DeleteReminderService = eventObj.container.resolve(DeleteReminderService);
    try {
        let result = null;
        result = await deleteReminderService.delete(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};