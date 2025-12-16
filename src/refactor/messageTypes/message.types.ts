export enum MessageHandlerType {
    NLP         = 'NLP',
    QnA         = 'QnA',
    Assessments = 'Assessments',
    Feedback    = 'Feedback',
    Custom      = 'Custom',
    Unhandled   = 'Unhandled',
    WorkflowService       = 'Alert',
    AssessmentWithFormSubmission = 'AssessmentWithFormSubmission',
    BasicCareplan   = 'BasicCareplan'
}

export enum NlpProviderType {
    Dialogflow = 'Dialogflow',
    LLM = 'LLM',
    LUIS = 'LUIS',
    RASA = 'RASA',
    None = 'None'
}

export enum UserFeedbackType {
    Positive = 'Positive',
    Negative = 'Negative',
    Neutral = 'Neutral',
    General = 'General',
}

export enum ChannelType {
    Whatsapp = 'Whatsapp',
    WhatsappD360 = 'WhatsappD360',
    Telegram = 'Telegram',
    Teams = 'Teams',
    Web = 'Web',
    Mobile = 'Mobile',
    Clickup = 'Clickup',
    Slack = 'Slack'
}

