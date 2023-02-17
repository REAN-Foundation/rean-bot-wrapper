import { Imessage, Iresponse } from "./message.interface";

export interface platformServiceInterface{
    handleMessage (msg: any, client);
    sendManualMesage(msg);
    init ();
    setWebhook(client);
    postResponse(messagetoDialogflow: Imessage, process_raw_dialogflow:any);
    // eslint-disable-next-line max-len
    SendMediaMessage(response_format:Iresponse, payload: any);
    set res(res);
    createFinalMessageFromHumanhandOver(requestBody:any);

}
