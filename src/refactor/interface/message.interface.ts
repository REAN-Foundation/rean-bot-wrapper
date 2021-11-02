export interface message{
    name : string;
    platform : string;
    sessionId : string;
    chat_message_id : string;
    direction: string;
    type : string;
    messageBody : string;
    latlong : string;
    replayPath : string;
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
