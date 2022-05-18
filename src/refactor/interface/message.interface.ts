export interface message{
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

export interface response{
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
    message: message;
}

export interface feedbackmessage{
    userId : string;
    message : string;
    channel : string;
    ts : string;
}

export interface chatMessage {
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
