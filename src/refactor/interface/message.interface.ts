export interface message{
    name : String;
    platform : String;
    sessionId : String;
    chat_message_id : String;
    direction: String;
    type : String;
    messageBody : String;
    latlong : String;
    replayPath : String;
}

export interface response{
    name : String;
    platform : String;
    sessionId: string;
    chat_message_id : String;
    direction: String;
    input_message;
    message_type: String;
    messageBody: String;
    messageText: String;
    raw_response_object: String;
    intent: String;
    messageImageUrl: string;
    messageImageCaption: string;
}

export interface handlerequest{
    botObject: any;
    message: message;
}