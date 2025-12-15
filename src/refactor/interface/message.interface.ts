import { IserviceResponseFunctionalities } from "../../services/response.format/response.interface";
import { MessageHandlerType, NlpProviderType, UserFeedbackType, ChannelType,} from "../messageTypes/message.types";

export interface Imessage{
    name             : string;
    platform         : string;
    platformId       : string;
    chat_message_id  : string;
    direction        : string;
    type             : string;
    messageBody      : string;
    imageUrl         : string;
    latlong          : any;
    replyPath        : string;
    intent           : string;
    responseMessageID: string;
    contextId        : string;
    originalMessage ?: string;
}

export interface Iresponse{
    name           : string;
    platform       : string;
    sessionId      : string;
    chat_message_id: string;
    direction      : string;
    input_message;
    message_type        : string;
    messageBody         : string;
    messageText         : string;
    intent              : string;
    messageImageUrl     : string;
    messageImageCaption : string;
    similarDoc          : string;
    sensitivity        ?: string;
    platformId          : string;
    buttonMetaData     ?: any;
    location ?: {
        latitude: number;
        longitude: number;
    }
}

export interface handlerequest{
    botObject: any;
    message: Imessage;
}

export interface feedbackmessage{
    userId : string;
    messageContent : string;
    channel : string;
    ts : string;
}

export interface IuserConsent{
consentId?: number;
userPlatformID:string;
consentGiven: string;
}

export interface IchatMessage {
    chatSessionID?: number,
    name: string,
    direction: string;
    messageType: string;
    messageContent: string;
    platform: string;
    userPlatformID: string;
    intent: string;
    imageContent: string;
    imageUrl: string;
    messageId: string;
    responseMessageID: string;
    whatsappResponseStatusReadTimestamp : Date;
    whatsappResponseStatusSentTimestamp : Date;
    whatsappResponseStatusDeliveredTimestamp : Date;
    supportchannelName : string;
    supportChannelTaskID: string;
    humanHandoff: string;
    feedbackType: string;
    sensitivity?: string;
}

export interface chatSession {
    autoIncrementalID: number;
    contactID: string;
    lastMessageDate: string;
    platform: string;
    sessionOpen: string;
    userPlatformID: string;
    preferredLanguage: string;
}

export interface contactList {
    autoIncrementalID: number;
    mobileNumber: string;
    ehrSystemCode?:string;
    patientUserId?:string;
    username: string;
    cmrChatTaskID?: string;
    cmrCaseTaskID?: string;
    platform: string;
    emailID: string;
    repetitionFlag:string;
    preferredLanguage?: string;
    optOut?: string;
}

export interface IMessageStatus {
    autoIncrementalID?: number;
    chatMessageId: number;
    channel: string;
    messageStatus: string;
    messageSentTimestamp: Date;
    messageDeliveredTimestamp: Date;
    messageReadTimestamp: Date;
    messageRepliedTimestamp: Date;
}

export interface IprocessedDialogflowResponseFormat{
    processed_message: any;
    message_from_nlp: IserviceResponseFunctionalities;
}

export interface calorieInfo {
    autoIncrementalID: number;
    user_message: string;
    fs_message: string;
    units: string;
    calories: number;
    user_calories:number;
    negative_feedback: number;
    meta_data: string;
    calories_updated: number;
}

export interface calorieDatabase {
    autoIncrementalID: number;
    food_name: string;
    message_id: number;
    fs_db_name: string;
    calories: number;
    value: number;
    meta_data: string;
}

export interface assessmentSessionLogs{
    autoIncrementalID?: number;
    patientUserId: string;
    assessmentTemplateId: string;
    assesmentId: string;
    assesmentNodeId: string;
    userResponseType: string;
    userResponse: string;
    userResponseTime: Date;
    userMessageId: string;
}

export interface consentInfo{
    autoIncrementalID?: number;
    Language:string;
    LanguageCode:string;
    MessageContent:string;
    WebsiteURL:string;
}

export interface IntentDetails {
    NLPProvider : NlpProviderType;
    IntentName  : string;
    Confidence ?: number;
    IntentContent ?: any;
}

export interface AssessmentDetails {
    AssessmentId    : string;
    AssessmentName  : string;
    TemplateId      : string;
    CurrentNodeId  ?: string;
    Question       ?: string;
    Hint           ?: string;
    UserResponse   ?: string | number | boolean | unknown;
    AssessmentFlag ?: boolean;
}

export interface Feedback {
    FeedbackContent ?: string;
    FeedbackType    ?: UserFeedbackType;
    SupportHandler  ?: SupportChannel;
}

export interface MessageChannelDetails {
    Channel     : ChannelType;
    ChannelUserId ?: string;
    ChannelMessageId ?: string;
    ChannelResponseMessageId ?: string;
}

export interface SupportChannel extends MessageChannelDetails {
    SupportTaskId: string;
}

export interface QnADetails {
    NLPProvider     : NlpProviderType;
    UserQuery       : string;
}

export interface AlertDetails {
    AlertId         ?: string;

}

export interface OutgoingMessage {
    PrimaryMessageHandler: MessageHandlerType;
    MetaData             : Imessage;
    Intent              ?: IntentDetails;
    Assessment          ?: AssessmentDetails;
    Feedback            ?: Feedback;
    QnA                 ?: QnADetails;
    Alert               ?: AlertDetails;
}

export interface IReminder {
    id?: number;
    MessageId: string;
    ReminderId: string;
    ReminderDate: string;
    ReminderTime: string;
    ParentActionId: string;
}
