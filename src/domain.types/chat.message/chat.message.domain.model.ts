export interface ChatMessageDto {
    Id?               : number;
    ChatSessionID?    : number;
    UserPlatformID?   : string;
    Platform?         : string;
    Name?             : string;
    MessageContent?   : string;
    MessageType?      : string;
    Direction?        : string;
    Intent?           : string;
    FeedbackType?     : string;
    MessageFlag?      : string;
    CreatedAt?        : Date;
    UpdatedAt?        : Date;
}
