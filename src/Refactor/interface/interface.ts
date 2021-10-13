export interface message{
    messageBody : String;
    sessionId : String;
    replayPath : String;
    latlong : String;
    type : String;
}

export interface response{
    sessionId: string;
    messageBody: string;
    messageImageUrl: string;
    messageImageCaption: string;
}