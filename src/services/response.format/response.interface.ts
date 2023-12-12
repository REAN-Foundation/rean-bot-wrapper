export interface IserviceResponse {
    text: any[];
    parse_mode: boolean;
    image: {
        url: string;
        caption: string;
    };
    payload: any;
}

export interface IserviceResponseFunctionalities {

    getText()
    getImageObject()
    getIntent()
    getPayload()
    getParseMode()

}
