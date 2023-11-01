/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Iresponse } from "../refactor/interface/message.interface";
import { UserLanguage } from "./set.language";
import { translateService } from "./translate.service";
import { HandleMessagetypePayload } from './handle.messagetype.payload';
import { inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class WhatsappPostResponseFunctionalities{

    constructor (
        @inject(HandleMessagetypePayload) private handleMessagetypePayload?: HandleMessagetypePayload,
        @inject(UserLanguage) private userLanguage?: UserLanguage,
        @inject(translateService) private _translateService?: translateService
    ) {}

    textResponseFormat = (response_format:Iresponse,payload) =>{
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta["text"] = {
            "body" : response_format.messageText
        };
        if (new RegExp("(https?:+)").test(response_format.messageText)) {
            postDataMeta["text"]["preview_url"] = true;
        } else {
            postDataMeta["text"]["preview_url"] = false;
        }
        postDataMeta.type = "text";
        return postDataMeta;
    };

    imageResponseFormat = (response_format:Iresponse,payload) => {
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        let imageLink =  response_format.messageBody;
        if (!imageLink) {
            imageLink = payload.fields.url.stringValue;
        }
        const message = this.messageTextAccordingToMessageType(response_format,payload,"image");
        postDataMeta["image"] = {
            "link"    : imageLink,
            "caption" : message
        };
        postDataMeta.type = "image";
        return postDataMeta;
    };

    voiceResponseFormat = (response_format:Iresponse,payload) => {
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta["audio"] = {
            "link" : response_format.messageBody
        };
        postDataMeta.type = "audio";
        return postDataMeta;
    };

    interactivebuttonsResponseFormat = async(response_format:Iresponse,payload) =>{
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        const buttons = [];
        const numberOfButtons = (payload.fields.buttons.listValue.values).length;
        const languageForSession = await this.userLanguage.getPreferredLanguageofSession(response_format.sessionId);
        for (let i = 0; i < numberOfButtons; i++){
            const id = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.id.stringValue;
            const title = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.title.stringValue;
            const translatedTitle = await this._translateService.translateResponse([title],languageForSession);
            const tempObject = {
                "type"  : "reply",
                "reply" : {
                    "id"    : id,
                    "title" : translatedTitle[0]
                }
            };
            buttons.push(tempObject);
        }
        const message = this.messageTextAccordingToMessageType(response_format,payload,"interactive-buttons");
        const translatedText = await this._translateService.translateResponse([message], languageForSession);
        postDataMeta["interactive"] = {
            "type" : "button",
            "body" : {
                "text" : translatedText[0]
            },
            "action" : {
                "buttons" : buttons
            }
        };
        postDataMeta.type = "interactive";
        return postDataMeta;

    };

    interactivelistResponseFormat = (response_format:Iresponse,payload) =>{
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        const rows_meta = [];
        var header = "";
        const list_meta = payload.fields.buttons.listValue.values;
        if (payload.fields.header){
            header = payload.fields.header.stringValue;
        } else {
            header = "LIST";
        }

        let count_meta = 0;
        for (const lit of list_meta){
            let id_meta = count_meta;
            let description_meta = "";
            if (lit.structValue.fields.description){
                description_meta = lit.structValue.fields.description.stringValue;
            }
            if (lit.structValue.fields.id){
                id_meta = lit.structValue.fields.id.stringValue;
            }
            const temp_meta = {
                "id"          : id_meta,
                "title"       : lit.structValue.fields.title.stringValue,
                "description" : description_meta
            };
            rows_meta.push(temp_meta);
            count_meta++;
        }
        postDataMeta["interactive"] = {
            "type"   : "list",
            "header" : {
                "type" : "text",
                "text" : header
            },
            "body" : {
                "text" : response_format.messageText
            },
            "action" : {
                "button"   : "Select From Here",
                "sections" : [
                    {
                        "rows" : rows_meta
                    }
                ]
            }
        };
        postDataMeta.type = "interactive";
        return postDataMeta;
    };

    templateResponseFormat = (response_format:Iresponse,payload) => {
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta["template"] = {
            "name"     : payload.templateName,
            "language" : {
                "code" : payload.languageForSession
            },
            "components" : [{
                "type"       : "body",
                "parameters" : payload.variables,

            },
            payload.buttonIds ? payload.buttonIds[0] : null,
            payload.buttonIds ? payload.buttonIds[1] : null]
        };

        if (payload.headers) {
            const headersLink = payload.headers.link;
            postDataMeta["template"].components.push({
                "type"       : "header",
                "parameters" : [
                    {
                        "type"     : "document",
                        "document" : {
                            "link" : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                        }
                    }
                ]
            });
        }
        postDataMeta.type = "template";
        return postDataMeta;
    };

    custom_payloadResponseFormat = async(response_format:Iresponse,payload) =>{
        const payloadContent = this.handleMessagetypePayload.getPayloadContent(payload);
        const listOfPostDataMeta = [];
        const languageForSession = await this.userLanguage.getPreferredLanguageofSession(response_format.sessionId);
        for (let i = 0; i < payloadContent.length; i++){
            const payloadContentMessageTypeMeta = payloadContent[i].fields.messagetype.stringValue;
            if ( payloadContentMessageTypeMeta === "interactive-buttons"){
                const postDataMeta =  await this.interactivebuttonsResponseFormat(response_format,payloadContent[i]);
                listOfPostDataMeta.push(postDataMeta);
            }
            else if (payloadContentMessageTypeMeta === "image") {
                const postDataMeta = this.imageResponseFormat(response_format,payloadContent[i]);
                listOfPostDataMeta.push(postDataMeta);
        
            }
            else {
                const payloadMessageMeta = await this._translateService.translateResponse([payloadContent[i].fields.content], languageForSession);
                response_format.messageText = payloadMessageMeta[0];
                const postDataMeta = this.textResponseFormat(response_format,payloadContent[i]);
                listOfPostDataMeta.push(postDataMeta);
            }
        }
        return listOfPostDataMeta;
    };

    postDataFormatWhatsapp = (contact) => {

        const postData = {
            "messaging_product" : "whatsapp",
            "recipient_type"    : "individual",
            "to"                : contact,
            "type"              : null
        };
        return postData;
    };

    messageTextAccordingToMessageType = (response_format:Iresponse, payload:any, custom_payload_type:string) => {
        let message = "";
        if (response_format.message_type === "custom_payload"){
            if (custom_payload_type === "interactive-buttons") {
                message = payload.fields.message.stringValue;
            }
            else if (custom_payload_type === "image") {
                message = payload.fields.title.stringValue;
            }
            else {

                //
            }
        }
        else {
            message = response_format.messageText;
        }
        return message;
    };

}
