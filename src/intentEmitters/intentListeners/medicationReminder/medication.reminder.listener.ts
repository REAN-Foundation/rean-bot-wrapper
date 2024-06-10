import { MedicationReminderService } from "../../../services/reminder/medication.reminder.service";

export const MedicationReminderListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const medicationReminderService: MedicationReminderService = eventObj.container.resolve(MedicationReminderService);
    try {
        let result = null;
        result = await medicationReminderService.createReminder(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
