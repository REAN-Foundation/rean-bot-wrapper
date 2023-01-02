/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import http from 'https';
import { AwsS3manager } from './aws.file.upload.service';
import { autoInjectable, singleton, inject, delay } from 'tsyringe';
import { MessageFlow } from './get.put.message.flow.service';
import { MessageFunctionalities } from './whatsapp.meta.functionalities';
import { clientAuthenticator } from './clientAuthenticator/client.authenticator.interface';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { getRequestOptions } from '../utils/helper';
import { ChatMessage } from '../models/chat.message.model';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow';
import { CommonWhatsappService } from './whatsapp.common.service';

@autoInjectable()
@singleton()
export class WhatsappMessageService extends CommonWhatsappService {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        awsS3manager?: AwsS3manager,
        private messageFunctionalities?: MessageFunctionalities,
        @inject("whatsapp.authenticator") private clientAuthenticator?: clientAuthenticator,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        whatsappMessageToDialogflow?: WhatsappMessageToDialogflow){
        super(messageFlow, awsS3manager, whatsappMessageToDialogflow);
    }

    sendManualMesage(msg: any) {
        return this.messageFlow.send_manual_msg(msg, this);
    }

    createRequestforWebhook(resolve, reject, apiKey) {
        const options = {
            hostname : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST"),
            path     : '/v1/configs/webhook',
            method   : 'POST',
            headers  : {
                'Content-Type' : 'application/json',
                'D360-Api-Key' : apiKey
            }
        };
        const request = http.request(options, (response) => {
            response.setEncoding('utf8');
            response.on('data', () => {
                resolve(true);
            });
            response.on('end', () => {
                console.log("Whbhook URL set for Whatsapp");
                resolve(true);
            });
        });
        request.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
            reject();
        });
        return request;
    }

    setWebhook(clientName: string){

        return new Promise((resolve, reject) => {
            const webhookUrl = `${this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL")}/v1/${clientName}/whatsapp/${this.clientAuthenticator.urlToken}/receive`;
            const postData = JSON.stringify({
                'url'     : webhookUrl,
                "headers" : {
                    "authentication" : this.clientAuthenticator.headerToken
                }
            });
            const apiKey = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");

            const request = this.createRequestforWebhook(resolve, reject, apiKey);

            // request.on('error', (e) => {
            //     console.error(`problem with request: ${e.message}`);
            //     reject();
            // });

            // Write data to request body
            request.write(postData);
            request.end();
        });
    }

    SetWebHookOldNumber = async (clientName: string) => {

        return new Promise((resolve, reject) => {
            const webhookUrl = `${this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL")}/v1/${clientName}/whatsapp/${this.clientAuthenticator.urlToken}/receive`;
            if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY_OLD_NUMBER")) {

                const postData = JSON.stringify({
                    'url' : webhookUrl,
                });

                const apiKey = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY_OLD_NUMBER");

                const request = this.createRequestforWebhook(resolve, reject, apiKey);

                // request.on('error', (e) => {
                //     console.error(`problem with request: ${e.message}`);
                //     reject();
                // });

                // Write data to request body
                request.write(postData);
                request.end();
            }
        });
    };

    SendWhatsappMessageOldNumber = async (contact, message) => {

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'recipient_type' : 'individual',
                'to'             : contact,
                'type'           : 'text',
                'text'           : {
                    'body' : message
                }
            });

            const options = {
                hostname : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST"),
                path     : '/v1/messages',
                method   : 'POST',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY_OLD_NUMBER")
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', () => {
                    resolve(true);
                });
                response.on('end', () => {
                    resolve(true);
                });
            });

            request.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject();
            });

            // Write data to request body
            request.write(postData);
            request.end();
        });
    };

    postDataFormatWhatsapp = (contact) => {
        const postData = {
            'recipient_type' : 'individual',
            'to'             : contact,
            'type'           : null
        };
        return postData;
    };

    async postRequestMessages(postdata) {
        return new Promise<any>(async(resolve,reject) =>{
            try {
                const options = getRequestOptions();
                options.headers['Content-Type'] = 'application/json';
                options.headers['D360-Api-Key'] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");
                const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST");
                const path = '/v1/messages';
                const apiUrl = "https://" + hostname + path;
                console.log("apiuri",apiUrl);
                // eslint-disable-next-line init-declarations
                await needle.post(apiUrl, postdata, options, function(err, resp) {
                    if (err) {
                        console.log("err", err);
                        reject(err);
                    }
                    console.log("resp", resp.body);
                    resolve(resp.body);
                });
                
            }
            catch (error) {
                console.log("error", error);
                reject(error.message);
            }
        });
    }

    async SendMediaMessage (contact: number | string, imageLink: string, message: string, messageType: string, payload: any) {
        
        console.log("message type",messageType + imageLink);
        message = this.messageFunctionalities.sanitizeMessage(message);
        const postData = this.postDataFormatWhatsapp(contact);
        if (messageType === "image") {
            if (!imageLink) {
                imageLink = payload.fields.url.stringValue;
            }
            postData["image"] = {
                "link"    : imageLink,
                "caption" : message
            };
            postData.type = "image";
            const postDataString = JSON.stringify(postData);
            return await this.postRequestMessages(postDataString);

        }
        else if (messageType === "voice"){
            postData["audio"] = {
                "link" : imageLink
            };
            postData.type = "audio";
            const postDataString = JSON.stringify(postData);
            console.log("this is the postDataString", postDataString);
            return await this.postRequestMessages(postDataString);
        }
        else if (messageType === "interactive-buttons"){
            const buttons1 = [];
            const numberOfButtons1 = (payload.fields.buttons.listValue.values).length;
            for (let i = 0; i < numberOfButtons1; i++){
                const id1 = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.id.stringValue;
                const title1 = payload.fields.buttons.listValue.values[i].structValue.fields.reply.structValue.fields.title.stringValue;
                const tempObject1 = {
                    "type"  : "reply",
                    "reply" : {
                        "id"    : id1,
                        "title" : title1
                    }
                };
                buttons1.push(tempObject1);
            }
            postData["interactive"] = {
                "type" : "button",
                "body" : {
                    "text" : message
                },
                "action" : {
                    "buttons" : buttons1
                }
            };
            postData.type = "interactive";
            const postDataString = JSON.stringify(postData);
            console.log("this is the postDataString", postDataString);
            return await this.postRequestMessages(postDataString);
        }
        else if (messageType === "interactive-list"){
            const rows = [];
            let header = "";
            const list = payload.fields.buttons.listValue.values;
            if (payload.fields.header){
                header = payload.fields.header.stringValue;
            } else {
                header = "LIST";
            }
            let count = 0;
            for (const lit of list){
                let id = count;
                let description_meta = "";
                if (lit.structValue.fields.description){
                    description_meta = lit.structValue.fields.description.stringValue;
                }
                if (lit.structValue.fields.id){
                    id = lit.structValue.fields.id.stringValue;
                }
                const temp = {
                    "id"          : id,
                    "title"       : lit.structValue.fields.title.stringValue,
                    "description" : description_meta
                };
                rows.push(temp);
                count++;
            }
            postData["interactive"] = {
                "type" : "list",
                "body" : {
                    "text" : message
                },
                "action" : {
                    "button"   : "Select From Here",
                    "sections" : [
                        {
                            "rows" : rows
                        }
                    ]
                }
            };
            postData.type = "interactive";
            const postDataString = JSON.stringify(postData);
            return await this.postRequestMessages(postDataString);
                
            // }
            // else if (messageType === "custom_payload") {
            //     const payloadContent = this.handleMessagetypePayload.getPayloadContent(payload);
            //     this.SendPayloadMessage(contact, imageLink, payloadContent);
        }
        else {
            postData["text"] = {
                "body" : message
            };
            if (new RegExp("(https?:+)").test(message)) {
                postData["preview_url"] = true;
            } else {
                postData["preview_url"] = false;
            }
            postData.type = "text";
            const postDataString = JSON.stringify(postData);
            const needleResp = await this.postRequestMessages(postDataString);
            const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: postData.to } });
            const id = respChatMessage[respChatMessage.length - 1].id;
            await ChatMessage.update({ whatsappResponseMessageId: needleResp.messages[0].id }, { where: { id: id } } )
                .then(() => { console.log("updated"); })
                .catch(error => console.log("error on update", error));
            return needleResp;
        }
    }

}
