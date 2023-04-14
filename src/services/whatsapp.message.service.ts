/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import http from 'https';
import { AwsS3manager } from './aws.file.upload.service';
import { inject, delay, scoped, Lifecycle } from 'tsyringe';
import { MessageFlow } from './get.put.message.flow.service';
import { clientAuthenticator } from './clientAuthenticator/client.authenticator.interface';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { getRequestOptions } from '../utils/helper';
import { ChatMessage } from '../models/chat.message.model';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow';
import { CommonWhatsappService } from './whatsapp.common.service';
import { Iresponse } from '../refactor/interface/message.interface';
import { WhatsappPostResponseFunctionalities } from './whatsapp.post.response.functionalities';
import { EntityManagerProvider } from './entity.manager.provider.service';

@scoped(Lifecycle.ContainerScoped)
export class WhatsappMessageService extends CommonWhatsappService {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(AwsS3manager) awsS3manager?: AwsS3manager,
        @inject("whatsapp.authenticator") private clientAuthenticator?: clientAuthenticator,
        @inject(WhatsappPostResponseFunctionalities) private whatsappPostResponseFunctionalities?: WhatsappPostResponseFunctionalities,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
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

    async SendMediaMessage (response_format:Iresponse, payload: any) {
        const type = response_format.message_type;
        if (type) {
            const classmethod = `${type}ResponseFormat`;
            const postDataMeta = await this.whatsappPostResponseFunctionalities[classmethod](response_format,payload);
            const postDataString = JSON.stringify(postDataMeta);
            const needleResp:any = await this.postRequestMessages(postDataString);

            //improve this DB query
            if (needleResp.statuscode === 200) {
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(ChatMessage);
                const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: response_format.sessionId } });
                const id = respChatMessage[respChatMessage.length - 1].id;
                await chatMessageRepository.update({ whatsappResponseMessageId: needleResp.body.messages[0].id }, { where: { id: id } } )
                    .then(() => { console.log("updated"); })
                    .catch(error => console.log("error on update", error));
                return needleResp;
            }
            
        }
    }

}
