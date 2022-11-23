import { Imessage } from "./message.interface";

export interface platformServiceInterface{
    getMessage (msg: any);
    handleMessage (msg: any, client);
    sendManualMesage(msg);
    init ();
    setWebhook(client);
    postResponse(messagetoDialogflow: Imessage, process_raw_dialogflow:any);
    // eslint-disable-next-line max-len
    SendMediaMessage(messagetoDialogflow_sessionId: string, response_format_messageBody: string,response_format_messageText:string, messageType: string, payload: any);
    set res(res);
    createFinalMessageFromHumanhandOver(requestBody:any);

}
