export enum MessageChannelType {
    WhatsApp = 'WhatsApp',
    Telegram = 'Telegram',
    Sms      = 'Sms',
    Other    = 'Other',
}

export enum UserMessageType {
    Text     = 'Text',
    Audio    = 'Audio',
    Video    = 'Video',
    Link     = 'Link',
    Location = 'Location',
    File     = 'File'
}

export enum ParamType {
    Phonenumber      = "Phonenumber",
    Email            = "Email",
    Location         = "Location",
    RestApiParams    = "RestApiParams",
    Date             = "Date",
    DateTime         = "DateTime",
    Float            = 'Float',
    Integer          = 'Integer',
    Boolean          = 'Boolean',
    Text             = 'Text',
    Array            = 'Array',
    Object           = 'Object',
    Placeholder      = 'Placeholder',
    NodeId           = 'NodeId',
    SchemaId         = 'SchemaId',
    SchemaInstanceId = 'SchemaInstanceId',
    NodeInstanceId   = 'NodeInstanceId',
    ChannelMessageId = 'ChannelMessageId',
    Unknown          = 'Unknown',
}
export enum MetaParamsType{
    Location  = 'Location',
    Text = 'Text',
    Phonenumber = 'Phonenumber',
    DateTime = 'DateTime'
}