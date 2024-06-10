/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Iresponse } from "../refactor/interface/message.interface";
import { UserLanguage } from "./set.language";
import { translateService } from "./translate.service";
import { HandleMessagetypePayload } from "./handle.messagetype.payload";
import { inject, Lifecycle, scoped } from "tsyringe";
import needle from 'needle';
import axios from 'axios';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class WhatsappWatiPostResponseFunctionalities {

    constructor (
        @inject(HandleMessagetypePayload) private handleMessagetypePayload?: HandleMessagetypePayload,
        @inject(UserLanguage) private userLanguage?: UserLanguage,
        @inject(translateService) private translateService?: translateService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    sendtextResponse = async(response_format:Iresponse, payload) => {
        try {
            const phoneNumber = response_format.platformId;
            const params = {'messageText': response_format.messageText};
            const watiUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_BASE_URL");
            const baseUrl = `${watiUrl}/api/v1/sendSessionMessage/${phoneNumber}?messageText=`;
            console.log("Sending Wati Text Response");
            const url = encodeURI(baseUrl + response_format.messageText);
            const options = {
                method  : 'POST',
                url     : url,
                headers : {
                    Authorization : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_TOKEN")
                }
            };
            const response = await axios.request(options).then(function (response){
                return response;
            }).catch(function (error) {
                console.log(error);
            });
            return response;
        } catch (error) {
            console.log("Error while sending text message to whatsapp wati", error);
        }
    };

    sendcustom_payloadResponse = async(response_format: Iresponse, payload) => {
        let response;
        const phoneNumber = response_format.platformId;
        const payloadContent = this.handleMessagetypePayload.getPayloadContent(payload);
        const listofPostDataWati = [];
        const languageForSession = await this.userLanguage.getPreferredLanguageofSession(response_format.sessionId);
        for (let i=0; i < payloadContent.length; i++){
            const payloadContentMessageTypeWati = payloadContent[i].fields.messagetype.stringValue;
            if (payloadContentMessageTypeWati === "interactive-buttons") {
                response = await this.sendinteractivebuttonsResponse(response_format, payloadContent[i]);
            } else if (payloadContentMessageTypeWati === "image") {
                // Method not implemented yet
            } else {
                const payloadMessageWati = await this.translateService.translateResponse([payloadContent[i].fields.content], languageForSession);
                response_format.messageText = payloadMessageWati[0];
                const postDataWati = await this.sendtextResponse(response_format, payloadContent[i]);
            }
        }
        return response;
    };

    sendinteractivebuttonsResponse = async(response_format: Iresponse, payload) => {
        const endPoint = "sendInteractiveButtonsMessage";
        const languageForSession = await this.userLanguage.getPreferredLanguageofSession(response_format.sessionId);
        const postDataWati = {
            "body" : "",
        };
        const buttons = await this.getButtonData(response_format, payload); 
        const message = this.messageTextAccordingToMessageType(response_format, payload, "interactive-buttons");
        const translatedText = await this.translateService.translateResponse([message], languageForSession);
        postDataWati["buttons"] = buttons;
        postDataWati["body"] = translatedText[0];
        const response = await this.postRequestToWati(response_format, endPoint, postDataWati);
        response["data"]["buttonMetaData"] = JSON.stringify(buttons);
        return response;
    };

    sendinteractivelistResponse = async (response_format: Iresponse, payload) => {
        const endPoint = "sendInteractiveListMessage";
        const postDataWati = {
            "body" : "",
        };
        const rows_wati = [];
        var buttonText = "";
        const list_wati = payload.fields.buttons.listValue.values;
        if (payload.fields.header){
            buttonText = payload.fields.header.stringValue;
        } else {
            buttonText = "LIST";
        }

        let count_wati = 0;
        for (const lit of list_wati){
            let id_wati = count_wati;
            let description_wati = "";
            if (lit.structValue.fields.description){
                description_wati = lit.structValue.fields.description.stringValue;
            } 
            if (lit.structValue.fields.id){
                id_wati = lit.structValue.fields.id.stringValue;
            }
            const temp_wati = {
                "id"          : id_wati,
                "title"       : lit.structValue.fields.title.stringValue,
                "description" : description_wati
            };
            rows_wati.push(temp_wati);
            count_wati++;
        }
        postDataWati["sections"] = [
            {
                "rows" : rows_wati
            }
        ];
        postDataWati["buttonText"] = buttonText;
        const response = await this.postRequestToWati(response_format, endPoint, postDataWati);
        return response;
    };

    async createTemplateParams(payload) {
        const customParams = [];
        let temp;
        let i;
        for (i in payload.variables) {
            temp = {
                "name"  : payload.variables[i].name,
                "value" : payload.variables[i].text
            };
            customParams.push(temp);
        }
        return customParams;
    }

    sendtemplateResponse = async (response_format: Iresponse, payload) => {
        const customParameters = await this.createTemplateParams(payload);
        const baseUrl = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_BASE_URL");
        const watiToken = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_TOKEN");
        const phoneNumber = response_format.platformId ? null : response_format.sessionId;
        const postDataWati = {
            "parameters"     : customParameters, // [{"name":"value", "name": "value"}]
            "template_name"  : payload.templateName,
            "broadcast_name" : "Reminder"
        };
        const options = {
            method  : "POST",
            url     : `${baseUrl}/api/v1/sendTemplateMessage?whatsappNumber=${phoneNumber}`,
            headers : {
                'content-type' : 'application/json-patch+json',
                Authorization  : watiToken
            },
            data : JSON.stringify(postDataWati)
        };
        const response = await axios
            .request(options)
            .then(function (response) {
                return response;
            })
            .catch(function (error) {
                console.error(error);
            });
        return response;
    };

    messageTextAccordingToMessageType = (response_format: Iresponse, payload: any, custom_payload_type: string) => {
        let message = "";
        if (response_format.message_type === "custom_payload"){
            if (custom_payload_type === "interactive-buttons") {
                message = payload.fields.message.stringValue;
            } else if (custom_payload_type === "image") {
                message = payload.fields.title.stringValue;
            } else {
                //
            }
        } else {
            message = response_format.messageText;
        }
        return message;
    };

    postRequestToWati = async (response_format: Iresponse, endPoint: string, postDataWati: any) => {
        const baseUrl = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_BASE_URL");
        const watiToken = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WATI_TOKEN");
        let phoneNumber;
        if (response_format.platformId){
            phoneNumber = response_format.platformId;
        } else {
            phoneNumber = response_format.sessionId;
        }
        const Url = `${baseUrl}/api/v1/${endPoint}?whatsappNumber=${phoneNumber}`;
        const options = {
            method  : 'POST',
            url     : Url,
            headers : {
                Authorization  : `${watiToken}`,
                'content-type' : 'application/json-patch+json'
            },
            data : JSON.stringify(postDataWati)
        };
        const response = await axios
            .request(options)
            .then(function (response) {
                return response;
            })
            .catch(function (error) {
                console.error(error);
            });
        return response;
    };

    getButtonData = async (response_format: Iresponse, payload) => {
        const buttons = [];
        const numberofButtons = (payload.fields.buttons.listValue.values).length;
        const languageForSession = await this.userLanguage.getPreferredLanguageofSession(response_format.sessionId);
        for (let i=0; i < numberofButtons; i++){
            const id = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.id.stringValue;
            const title = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.title.stringValue;
            const translatedTitle = await this.translateService.translateResponse([title], languageForSession);
            const tempObject = {
                "id"   : id,
                "text" : translatedTitle[0]
            };
            buttons.push(tempObject);
        }
        return buttons;
    };
}