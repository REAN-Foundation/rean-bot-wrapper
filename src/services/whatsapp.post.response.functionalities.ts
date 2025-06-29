/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { Iresponse } from "../refactor/interface/message.interface";
import { UserLanguage } from "./set.language";
import { translateService } from "./translate.service";
import { HandleMessagetypePayload } from './handle.messagetype.payload';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class WhatsappPostResponseFunctionalities{

    constructor (
        @inject(HandleMessagetypePayload) private handleMessagetypePayload?: HandleMessagetypePayload,
        @inject(UserLanguage) private userLanguage?: UserLanguage,
        @inject(translateService) private _translateService?: translateService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {}

    textResponseFormat = (response_format:Iresponse,payload) =>{
        console.log(`........From textResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
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
        console.log(`........From imageResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
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
        console.log(`........From voiceResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta["audio"] = {
            "link" : response_format.messageBody
        };
        postDataMeta.type = "audio";
        return postDataMeta;
    };

    interactivebuttonsResponseFormat = async(response_format:Iresponse,payload) =>{
        console.log(`........From interactivebuttonsResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        const buttons = [];
        const numberOfButtons = (payload.fields.buttons.listValue.values).length;
        const languageForSession = await this.userLanguage.getPreferredLanguageofSession(response_format.sessionId);
        const customTranslateSetting: boolean = this.clientEnvironmentProviderService.getClientEnvironmentVariable("FIX_LANGUAGE") === "true";
        const listOfNoTranslateIntents = this.clientEnvironmentProviderService.getClientEnvironmentVariable("FIX_LANGUAGE_INTENTS") ?? [];
        const intent = response_format.intent;
        for (let i = 0; i < numberOfButtons; i++){
            const id = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.id.stringValue;
            const title = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.title.stringValue;
            let translatedTitle = [title];
            if (listOfNoTranslateIntents.includes(intent) && customTranslateSetting) {
                translatedTitle = [title];
            } else {
                translatedTitle = await this._translateService.translateResponse([title],languageForSession);
            }

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
        let translatedText = [message];
        if (listOfNoTranslateIntents.includes(intent) && customTranslateSetting) {
            translatedText = [message];
        } else {
            translatedText = await this._translateService.translateResponse([message], languageForSession);
        }
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
        console.log(`........From interactivelistResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        const rows_meta = [];
        var header = "";
        const list_meta = payload.fields.buttons.listValue.values;
        if (payload.fields.header){
            header = payload.fields.header.stringValue;
        } else {
            header = "Select ";
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

    // templateResponseFormat = (response_format:Iresponse,payload) => {
    //     console.log(`........From templateResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
    //     const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
    //     postDataMeta.type = response_format.message_type;
    //     postDataMeta["template"] = {
    //         "name"     : payload.templateName,
    //         "language" : {
    //             "code" : payload.languageForSession ?? "en"
    //         },
    //         "components" : [{
    //             "type"       : "body",
    //             "parameters" : payload.variables

    //         },

    //         // payload.buttonIds ? payload.buttonIds[0] : null,
    //         // payload.buttonIds ? payload.buttonIds[1] : null,
    //         // payload.buttonIds ? payload.buttonIds[2] : null
    //         ...(payload.buttonIds || []).filter(Boolean)
    //         ]
    //     };
    //     console.log(`******payload: ${JSON.stringify(postDataMeta, null, 2)}`, );
    //     return postDataMeta;
    // }

    templateResponseFormat = (response_format, payload) => {
        console.log(`........From templateResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`);
    
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta.type = response_format.message_type;
        postDataMeta["template"] = {
            "name"     : payload.templateName,
            "language" : {
                "code" : payload.languageForSession ?? "en"
            },
            "components" : [

                // Add Header if location exists
                ...(payload.location ? [{
                    "type"       : "header",
                    "parameters" : [{
                        "type"     : "location",
                        "location" : {
                            "latitude"  : payload.location.latitude,
                            "longitude" : payload.location.longitude,
                            "name"      : payload.location.name ?? "Incident Location",
                            "address"   : payload.location.address ?? "Location details"
                        } }]
                }] : []),
    
                ...(payload.headers ? [{
                    "type"       : "header",
                    "parameters" : [
                        payload.headers
                    ]
                }] : []),
    
                // Body parameters
                {
                    "type"       : "body",
                    "parameters" : payload.variables
                },
    
                // Buttons (if any)
                ...(payload.buttonIds || []).filter(Boolean)
            ]
        };
    
        // console.log(`******payload: ${JSON.stringify(postDataMeta, null, 2)}`);
        return postDataMeta;
    };
    
    locationResponseFormat = async(response_format:Iresponse,payload) => {
        console.log(`........From locationResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta.type = "location";
        postDataMeta["location"] = {
            "name"      : "Emergency Location",
            "latitude"  : response_format.location.latitude,
            "longitude" : response_format.location.longitude,
        };
        
        return postDataMeta;
    };

    questionResponseFormat = async(response_format:Iresponse,payload) => {
        console.log(`........From questionResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
        const buttons = [];
        for (let i = 0; i < response_format.buttonMetaData.length; i++) {
            buttons.push({
                "type"  : "reply",
                "reply" : {
                    "id"    : response_format.buttonMetaData[i].Sequence.toString(),
                    "title" : response_format.buttonMetaData[i].Text
                }
            });
        }
        const postDataMeta = this.postDataFormatWhatsapp(response_format.sessionId);
        postDataMeta.type = "interactive";
        postDataMeta["interactive"] = {
            "type" : "button",
            "body" : {
                "text" : response_format.messageText
            },
            "action" : {
                "buttons" : [
                    ...buttons
                ]
            }
          
        };
        
        return postDataMeta;
    };

    custom_payloadResponseFormat = async(response_format:Iresponse,payload) =>{
        console.log(`........From custom_payloadResponseFormat ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
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
        console.log(`........From messageTextAccordingToMessageType ${response_format} payload: ${JSON.stringify(payload, null, 2)}`, );
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
