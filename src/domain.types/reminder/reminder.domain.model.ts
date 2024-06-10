export interface ReminderDomainModel {
    id                   ?: string;
    UserId                : string;
    Name                  : string;
    ReminderType          : ReminderType;
    WhenDate             ?: string;
    WhenTime              : string;
    StartDate            ?: Date;
    EndDate              ?: Date;
    EndAfterNRepetitions ?: number;
    RepeatList           ?: string[];
    RepeatAfterEvery     ?: number;
    RepeatAfterEveryNUnit?: RepeatAfterEveryNUnit;
    HookUrl              ?: string;
    NotificationType     ?: NotificationType;
    RawContent            : string;
}

export const MAX_REPEAT_AFTER_EVERY_N = 100;
export const DEFAULT_END_AFTER_N_REPETITIONS = 10;
export const MAX_END_AFTER_N_REPETITIONS = 1000;

//Max End After are allowed approximately for 3 years
export const MAX_END_AFTER_MONTHS = 36;
export const MAX_END_AFTER_YEARS = 3;
export const MAX_END_AFTER_QUARTERS = 12;
export const MAX_END_AFTER_WEEKS = 156;
export const MAX_END_AFTER_DAYS = 1095;

///////////////////////////////////////////////////////////////////////////////////////

export enum ReminderType {
    OneTime = 'OneTime',
    RepeatAfterEveryN = 'Repeat-After-Every-N',
    RepeatEveryWeekday = 'Repeat-Every-Weekday',
    RepeatEveryWeekOnDays = 'Repeat-Every-Week-On-Days',
    RepeatEveryMonthOn = 'Repeat-Every-Month-On',
    RepeatEveryQuarterOn = 'Repeat-Every-Quarter-On',
    RepeatEveryHour = 'Repeat-Every-Hour',
    RepeatEveryDay = 'Repeat-Every-Day',
    CustomFrequency = 'CustomFrequency',
}

export const ReminderTypeList: ReminderType [] = [
    ReminderType.OneTime,
    ReminderType.RepeatAfterEveryN,
    ReminderType.RepeatEveryWeekday,
    ReminderType.RepeatEveryWeekOnDays,
    ReminderType.RepeatEveryMonthOn,
    ReminderType.RepeatEveryQuarterOn,
    ReminderType.RepeatEveryHour,
    ReminderType.RepeatEveryDay,
    ReminderType.CustomFrequency,
];

export enum ReminderCustomFrequencyType {
    Hourly        = 'Hourly',
    Daily         = 'Daily',
    Weekly        = 'Weekly',
    Monthly       = 'Monthly',
    Yearly        = 'Yearly',
}

export const ReminderCustomFrequencyTypeList: ReminderCustomFrequencyType [] = [
    ReminderCustomFrequencyType.Hourly,
    ReminderCustomFrequencyType.Daily,
    ReminderCustomFrequencyType.Weekly,
    ReminderCustomFrequencyType.Monthly,
    ReminderCustomFrequencyType.Yearly,
];

export enum RepeatAfterEveryNUnit {
    Minute  = 'Minute',
    Hour    = 'Hour',
    Day     = 'Day',
    Week    = 'Week',
    Month   = 'Month',
    Quarter = 'Quarter',
    Year    = 'Year',
}

export const RepeatAfterEveryUnitList: RepeatAfterEveryNUnit [] = [
    RepeatAfterEveryNUnit.Minute,
    RepeatAfterEveryNUnit.Hour,
    RepeatAfterEveryNUnit.Day,
    RepeatAfterEveryNUnit.Week,
    RepeatAfterEveryNUnit.Month,
    RepeatAfterEveryNUnit.Quarter,
    RepeatAfterEveryNUnit.Year,
];

export enum NotificationType {
    Email          = 'Email',
    SMS            = 'SMS',
    WebPush        = 'WebPush',
    MobilePush     = 'MobilePush',
    Webhook        = 'Webhook',
    WhatsApp       = 'WhatsApp',
    Telegram       = 'Telegram',
    Slack          = 'Slack',
    MicrosoftTeams = 'MicrosoftTeams',
    WhatsappWati   = 'WhatsappWati'
}

export const NotificationTypeList: NotificationType [] = [
    NotificationType.Email,
    NotificationType.SMS,
    NotificationType.WebPush,
    NotificationType.MobilePush,
    NotificationType.Webhook,
    NotificationType.WhatsApp,
    NotificationType.Telegram,
    NotificationType.Slack,
];

export interface ReminderBody {
    TaskName      : string;
    TaskType      : string;
    Frequency     : string;
    DayName       : string;
    StartDateTime : string;
    MedicineName  : string;
    PatientUserId : string;
    TimeString   ?: string;
    DateString   ?: string;
  }
