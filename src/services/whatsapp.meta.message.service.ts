/* eslint-disable init-declarations */
/* eslint-disable max-len */
import { AwsS3manager } from './aws.file.upload.service.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { inject, delay, scoped, Lifecycle } from 'tsyringe';
import { MessageFlow } from './get.put.message.flow.service.js';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';
import needle from 'needle';
import { getRequestOptions } from '../utils/helper.js';
import { ChatMessage } from '../models/chat.message.model.js';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow.js';
import { CommonWhatsappService } from './whatsapp.common.service.js';
import type { Iresponse } from '../refactor/interface/message.interface.js';
import { WhatsappPostResponseFunctionalities } from './whatsapp.post.response.functionalities.js';
import { EntityManagerProvider } from './entity.manager.provider.service.js';
import { LogsQAService } from './logs.for.qa.js';

@scoped(Lifecycle.ContainerScoped)
export class WhatsappMetaMessageService extends CommonWhatsappService {

    // public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(AwsS3manager) awsS3manager?: AwsS3manager,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(WhatsappMessageToDialogflow) whatsappMessageToDialogflow?: WhatsappMessageToDialogflow,
        @inject(WhatsappPostResponseFunctionalities) private whatsappPostResponseFunctionalities?: WhatsappPostResponseFunctionalities,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(LogsQAService) private logsQAService?: LogsQAService,){
        super(messageFlow, awsS3manager, whatsappMessageToDialogflow);
    }

    async sendManualMesage(msg: any) {
        return await this.messageFlow.send_manual_msg(msg, this);
    }

    postDataFormatWhatsapp = (contact) => {

        const postData = {
            "messaging_product" : "whatsapp",
            "recipient_type"    : "individual",
            "to"                : contact,
            "type"              : null
        };
        return postData;
    };

    async postRequestMessages(postdata) {
        return new Promise(async(resolve,reject) =>{
            try {
                console.log("NAME",this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME"));
                const options = getRequestOptions();
                const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
                options.headers['Content-Type'] = 'application/json';
                options.headers['Authorization'] = `Bearer ${token}`;
                const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
                const version = process.env.WHATSAPP_API_VERSION;
                const whatsappPhoneNumberID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
                const path = `/${version}/${whatsappPhoneNumberID}/messages`;
                const apiUrl_meta = hostname + path;
                console.log("The request sent to whatsapp has body: ", JSON.stringify(postdata));
                const response = await needle("post", apiUrl_meta, postdata, options);
                console.log("Response from whatsapp send message status code: ",response?.statusCode);
                console.log("Response from whatsapp send message: ",response?.body);
                resolve(response);
            }
            catch (error) {
                console.log("error", error);
                reject(error.message);
            }
        });
    }

    SendMediaMessage = async (response_format:Iresponse, payload: any) => {
        try {
            let type = response_format.message_type;
            if (type === "Location") {
                type = 'location';
            }

            if (type) {
                const classmethod = `${type}ResponseFormat`;
                const postDataMeta = await this.whatsappPostResponseFunctionalities[classmethod](response_format,payload);

                //custom payload helps in sending multiple response to a single request. The multiple response are handled in an array
                if (Array.isArray(postDataMeta)){
                    for (let i = 0; i < postDataMeta.length; i++){
                        if ( i === 0) {
                            await this.postRequestMessages(postDataMeta[i]);
                        }
                        else {
                            await this.delay();
                            await this.postRequestMessages(postDataMeta[i]);
                        }
                    }
                }
                else {
                    const postDataString = JSON.stringify(postDataMeta);
                    const needleResp:any = await this.postRequestMessages(postDataString);

                    //improve this DB query
                    if (needleResp.statusCode === 200) {
                        console.log(`QA_SERVICE Flag: ${this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE")}`);
                        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("QA_SERVICE")) {
                            if (response_format.name !== "ReanCare") {
                                console.log("Providing QA service through clickUp");
                                await this.logsQAService.logMesssages(response_format);
                            }
                        }
                        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                        const respChatMessage = await chatMessageRepository.findAll({ where: { userPlatformID: response_format.sessionId } });
                        if (respChatMessage.length > 0) {
                            const id = respChatMessage[respChatMessage.length - 1].id;
                            await chatMessageRepository.update({ responseMessageID: needleResp.body.messages[0].id }, { where: { id: id } } )
                                .then(() => { console.log("updated"); })
                                .catch(error => console.log("error on update", error));

                            //Added else for those who haven't send any message on bot(blood warrior)
                        } else {
                            const chatMessageObj = {
                                chatSessionID     : response_format.chat_message_id,
                                responseMessageID : needleResp.body.messages[0].id,
                                platform          : response_format.platform,
                                direction         : response_format.direction,
                                messageType       : response_format.message_type,
                                messageContent    : response_format.messageText,
                                imageContent      : response_format.messageBody,
                                imageUrl          : response_format.messageImageUrl,
                                userPlatformID    : response_format.sessionId,
                                intent            : payload ? payload.templateName : null
                            };
                            await chatMessageRepository.create(chatMessageObj)
                                .then(() => { console.log("created"); })
                                .catch(error => console.log("error on create chatMessage entry", error));
                        }
                        return needleResp;
                    }
                }

            }
        } catch (error) {
            console.log("error", error);
            return null;
        }

    };

    delay = async() => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        let delayClientPreference;
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable("DELAY_IN_RESPONSE")) {
            delayClientPreference = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DELAY_IN_RESPONSE");
        }
        else {
            delayClientPreference = 500;
        }
        await delay(delayClientPreference);

    };

}
