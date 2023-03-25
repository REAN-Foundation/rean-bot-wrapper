/* eslint-disable init-declarations */
/* eslint-disable max-len */
import { AwsS3manager } from './aws.file.upload.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable, singleton, inject, delay, scoped, Lifecycle } from 'tsyringe';
import { MessageFlow } from './get.put.message.flow.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { getRequestOptions } from '../utils/helper';
import { ChatMessage } from '../models/chat.message.model';
import { WhatsappMessageToDialogflow } from './whatsapp.messagetodialogflow';
import { CommonWhatsappService } from './whatsapp.common.service';
import { Iresponse } from '../refactor/interface/message.interface';
import { WhatsappPostResponseFunctionalities } from './whatsapp.post.response.functionalities';

// @autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class WhatsappMetaMessageService extends CommonWhatsappService {

    public res;

    constructor(@inject(delay(() => MessageFlow)) public messageFlow,
        @inject(AwsS3manager) awsS3manager?: AwsS3manager,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(WhatsappMessageToDialogflow) whatsappMessageToDialogflow?: WhatsappMessageToDialogflow,
        @inject(WhatsappPostResponseFunctionalities) private whatsappPostResponseFunctionalities?: WhatsappPostResponseFunctionalities){
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
                const options = getRequestOptions();
                const token = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_API_TOKEN");
                options.headers['Content-Type'] = 'application/json';
                options.headers['Authorization'] = `Bearer ${token}`;
                const hostname = this.clientEnvironmentProviderService.getClientEnvironmentVariable("META_WHATSAPP_HOST");
                const whatsappPhoneNumberID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");
                const path = `/v14.0/${whatsappPhoneNumberID}/messages`;
                const apiUrl_meta = hostname + path;
                const response = await needle("post", apiUrl_meta, postdata, options);
                console.log(response.body);
                resolve(response);
            }
            catch (error) {
                console.log("error", error);
                reject(error.message);
            }
        });
    }

    SendMediaMessage = async (response_format:Iresponse, payload: any) => {
        const type = response_format.message_type;
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
                    const respChatMessage = await ChatMessage.findAll({ where: { userPlatformID: response_format.sessionId } });
                    const id = respChatMessage[respChatMessage.length - 1].id;
                    await ChatMessage.update({ whatsappResponseMessageId: needleResp.body.messages[0].id }, { where: { id: id } } )
                        .then(() => { console.log("updated"); })
                        .catch(error => console.log("error on update", error));
                    return needleResp;
                }
            }
            
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
