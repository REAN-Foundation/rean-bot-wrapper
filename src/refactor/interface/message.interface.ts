import { IserviceResponseFunctionalities } from "../../services/response.format/response.interface";

export interface Imessage{
    name : string;
    platform : string;
    platformId : string;
    chat_message_id : string;
    direction: string;
    type : string;
    messageBody : string;
    imageUrl : string;
    latlong : any;
    replyPath : string;
    intent  : string;
    responseMessageID : string;
    contextId : string;

}

export interface Iresponse{
    name : string;
    platform : string;
    sessionId: string;
    chat_message_id : string;
    direction: string;
    input_message;
    message_type: string;
    messageBody: string;
    messageText: string;
    intent: string;
    messageImageUrl: string;
    messageImageCaption: string;
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
    username: string;
    platform: string;
    emailID: string;
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
