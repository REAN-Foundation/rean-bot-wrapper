import { AppointmentReminderService } from "../../../services/reminder/appointment.reminder.service";

export const AppointmentReminderListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const appointmentReminderService: AppointmentReminderService = eventObj.container.resolve(AppointmentReminderService);
    try {
        let result = null;
        result = await appointmentReminderService.createReminder(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
