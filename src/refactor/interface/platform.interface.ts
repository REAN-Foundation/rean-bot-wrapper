import { message } from "./message.interface";

export interface platformServiceInterface{
    getMessage (msg: any);
    handleMessage (msg: any, client);
    init (client);
    postResponse(messagetoDialogflow: message, process_raw_dialogflow:any);
    SendMediaMessage(SmessagetoDialogflow_sessionId: String, response_format_messageBody: String,response_format_messageText:String );
    set res(res);

}