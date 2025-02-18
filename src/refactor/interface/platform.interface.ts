import { Imessage, Iresponse } from "./message.interface";

export interface platformServiceInterface {

    init ();

    handleMessage (msg: any, client);

    sendManualMesage(msg);

    setWebhook(client);

    postResponse(messagetoDialogflow: Imessage, process_raw_dialogflow:any);

    SendMediaMessage(response_format:Iresponse, payload: any);

    set res(res);

    createFinalMessageFromHumanhandOver(requestBody:any);

    getMessageIdFromResponse(responseBody:any)
}
