export interface Imessage{
    name : string;
    platform : string;
    sessionId : string;
    chat_message_id : string;
    direction: string;
    type : string;
    messageBody : string;
    latlong : string;
    replyPath : string;
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
    raw_response_object: string;
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
    message : string;
    channel : string;
    ts : string;
}

export interface IchatMessage {
    name: string,
    direction: string;
    messageType: string;
    messageContent: string;
    platform: string;
    userPlatformID: string;
    intent: string;
    imageContent: string;
    imageUrl: string;
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

export interface IdialogflowResponseFormat {
        text       :any[],
        image      :Record<string, unknown>,
        parse_mode :any,
        result     :any
}

export interface IprocessedDialogflowResponseFormat{
    processed_message: any;
    message_from_dialoglow: {
        text: any[];
        image: {
            url: string;
            caption: string;
        };
        parse_mode: any;
        result: any;
    };
}

export interface calorieInfo {
    autoIncrementalID: number;
    user_food_name: string;
    fs_food_name: string;
    units: string;
    calories: number;
    negative_feedback: number;
    meta_data: string;
}
