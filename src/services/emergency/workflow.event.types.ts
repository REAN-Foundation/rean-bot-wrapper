
export type uuid    = string | undefined | null;
export type decimal = number | undefined | null;
export type integer = number | undefined | null;

export interface Location {
    Name     ?: string;
    Latitude ?: number;
    Longitude?: number;
}

export enum UserMessageType {
    Text             = 'Text',
    Audio            = 'Audio',
    Video            = 'Video',
    Link             = 'Link',
    Location         = 'Location',
    File             = 'File',
    Question         = 'Question',
    QuestionResponse = 'QuestionResponse',
    Image            = 'Image',
}

export enum QuestionResponseType {
    Text                  = 'Text',
    Float                 = 'Float',
    Integer               = 'Integer',
    Boolean               = 'Boolean',
    Object                = 'Object',
    TextArray             = 'Text Array',
    FloatArray            = 'Float Array',
    IntegerArray          = 'Integer Array',
    BooleanArray          = 'Boolean Array',
    ObjectArray           = 'Object Array',
    Biometrics            = 'Biometrics',
    SingleChoiceSelection = 'Single Choice Selection',
    MultiChoiceSelection  = 'Multi Choice Selection',
    File                  = 'File',
    Date                  = 'Date',
    DateTime              = 'DateTime',
    Rating                = 'Rating',
    Location              = 'Location',
    Range                 = 'Range',
    Ok                    = 'Ok', //Acknowledgement
    None                  = 'None', //Not expecting response
}

export interface QuestionAnswerOption {
    id?               : uuid;
    Text              : string;
    ImageUrl?         : string;
    Sequence          : number;
    Metadata          : { Key: string, Value: string }[];
}

export interface QuestionResponseMessage {
    QuestionId                      ?: uuid;
    QuestionText                    ?: string;
    QuestionOptions                 ?: QuestionAnswerOption[];
    ResponseType                    ?: QuestionResponseType;
    ResponseContent                 ?: string | number | boolean | any[];
    SingleChoiceChosenOption        ?: string;
    SingleChoiceChosenOptionSequence?: number;
    PreviousMessageId               ?: uuid;
    PreviousNodeId                  ?: uuid;
}

export interface MessagePayload {
    MessageType               : string;
    ProcessingEventId         : uuid;
    ChannelType               : string;
    ChannelMessageId          : string;
    PreviousChannelMessageId ?: string;
    MessageTemplateId        ?: string;
    PreviousMessageTemplateId?: string;
    BotMessageId              : uuid;
    PreviousBotMessageId     ?: uuid;
    SchemaId                 ?: uuid;
    SchemaInstanceId         ?: uuid;
    SchemaInstanceCode       ?: string;
    SchemaName               ?: string;
    NodeInstanceId           ?: uuid;
    NodeId                   ?: uuid;
    ActionId                 ?: uuid;
    Metadata                 ?: any[];
}

// Back and forth
export interface WorkflowUserMessage {
    Phone?               : string;
    EventTimestamp       : string;
    MessageType          : string;
    MessageChannel       : string;
    TextMessage         ?: string;
    ImageUrl            ?: string;
    AudioUrl            ?: string;
    VideoUrl            ?: string;
    Location            ?: Location;
    FileUrl             ?: string;
    QuestionText        ?: string;
    QuestionOptions     ?: QuestionAnswerOption[];
    QuestionResponse    ?: QuestionResponseMessage;
    QuestionResponseType?: QuestionResponseType;
    Placeholders        ?: { Key: string, Value: string }[];
    Payload             ?: MessagePayload;
}

export interface WorkflowEvent {
    TenantId         : string;
    EventType        : string;
    SchemaId         : string;
    SchemaInstanceId : string;
    UserMessage      : WorkflowUserMessage;
}

////////////////////////////////////////////////////////////////
