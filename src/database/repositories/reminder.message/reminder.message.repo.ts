import { ReminderMessageDto } from "../../../domain.types/reminder.message/reminder.message.domain.model";
import { ReminderMessage } from "../../../models/reminder.model";

///////////////////////////////////////////////////////////////////////////////

export class ReminderMessageMapper {

    static toDto = (reminderMessage: ReminderMessage): ReminderMessageDto => {
        if (!reminderMessage) {
            return null;
        }

        const dto: ReminderMessageDto = {
            id             : reminderMessage.id,
            userId         : reminderMessage.userId,
            MessageId      : reminderMessage.MessageId,
            ReminderId     : reminderMessage.ReminderId,
            ReminderDate   : reminderMessage.ReminderDate,
            ReminderTime   : reminderMessage.ReminderTime,
            ParentActionId : reminderMessage.ParentActionId,
        };

        return dto;
    };
}
