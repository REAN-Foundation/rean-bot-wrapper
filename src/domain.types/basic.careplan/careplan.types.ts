export interface CareplanIntentMetadata {
    Message      : string;
    MessageType  : "text" | "interactivebuttons" | "inline_keyboard" | "template";
    TemplateName?: string;
    Buttons?     : { Title: string; id: string }[];
    Variables?   : Record<string, any[]>;
}

export interface CareplanEnrollmentDomainModel {
    Provider : string;
    PlanName : string;
    PlanCode : string;
    Language? : string;
    StartDate?: string;
    DayOffset? : number;
    Channel: string;
    TenantName: string;
    IsTest?: boolean;
}

export interface CareplanEvent {
    ClientName: string;
    Channel: string;
    PlatformUserId?: string;
}
