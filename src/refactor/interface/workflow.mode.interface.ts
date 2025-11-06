import type { uuid } from "../../services/emergency/workflow.event.types.js";
import { MessageChannelType, MetaParamsType, UserMessageType } from "../messageTypes/workflow.mode.message.types.js";

//////////////////////////////////////////////////////////////////////////////

export interface Location {
    Name     ?: string;
    Latitude ?: number;
    Longitude?: number;
}

export interface QuestionOption {
    id?               : uuid;
    NodeId?           : uuid;
    Text              : string;
    ImageUrl?         : string;
    Sequence          : number;
    Metadata          : string;
}

export interface QuestionResponseMessage {
    QuestionId          ?: uuid;
    QuestionText        ?: string;
    QuestionOptions     ?: QuestionOption[];
    ChosenOption        ?: string;
    ChosenOptionSequence?: number;
    PreviousMessageId   ?: uuid;
    PreviousNodeId      ?: uuid;
}

export interface MessagePayload {
    MessageType               : UserMessageType;
    ProcessingEventId         : uuid;
    ChannelType               : MessageChannelType;
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
    Metadata                 ?: Params[];
}

// Back and forth
export interface WorkflowUserMessage {
    Phone?           : string;
    EventTimestamp   : string;
    MessageType      : UserMessageType;
    MessageChannel   : MessageChannelType;
    TextMessage     ?: string;
    ImageUrl        ?: string;
    AudioUrl        ?: string;
    VideoUrl        ?: string;
    Location        ?: Location;
    FileUrl         ?: string;
    Question        ?: string;
    QuestionOptions ?: QuestionOption[];
    QuestionResponse?: QuestionResponseMessage;
    Placeholders    ?: { Key: string, Value: string }[];
    Payload         ?: MessagePayload;
}

export interface Params {
    Name         : string;
    Description  ?: string;
    Type         : MetaParamsType;
    Value        ?: string;
}

export enum EventType {
    UserMessage          = 'UserMessage',
    WorkflowSystemMessage= 'WorkflowSystemMessage',
    TerminateWorkflow    = 'TerminateWorkflow',
    TriggerChildWorkflow = 'TriggerChildWorkflow',
}

export interface WorkflowEvent {
    EventType        : EventType;
    TenantId         : uuid;
    SchemaId        ?: uuid;
    SchemaInstanceId?: uuid;
    UserMessage     ?: WorkflowUserMessage;
}
