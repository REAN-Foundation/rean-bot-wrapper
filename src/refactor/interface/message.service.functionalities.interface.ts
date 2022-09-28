export interface getMessageFunctionalities {
    textMessageFormat (message);
    locationMessageFormat (msg);
    voiceMessageFormat (msg: any, type:string, chanel: string);
}