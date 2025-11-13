export interface ReminderMessageDto {
    id?: number;
    userId: string;
    MessageId: string;
    ReminderId?: string;
    ReminderDate?: string;
    ReminderTime?: string;
    ParentActionId?: string;
}
