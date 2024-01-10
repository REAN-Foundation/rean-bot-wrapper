import { AppointmentUserReplyService } from "../../../services/reminder/appointmentReminderReply/user.reply.service";
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

export const AppointmentReminderReplyListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const appointmentUserReplyService: AppointmentUserReplyService = eventObj.container.resolve(AppointmentUserReplyService);
    try {
        let result = null;
        result = await appointmentUserReplyService.sendUserResponse(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
