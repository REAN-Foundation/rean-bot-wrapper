export interface message{
    messageBody : String;
    sessionId : String;
    replayPath : String;
    latlong : String;
    type : String;
}

export interface response{
    sessionId: string;
    messageBody: String;
    messageText: String;
    messageImageUrl: string;
    messageImageCaption: string;
}

export interface handlerequest{
    botObject: any;
    message: message;
}