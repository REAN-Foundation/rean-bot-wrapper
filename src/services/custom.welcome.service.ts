import { inject, Lifecycle, scoped } from "tsyringe";
import type { platformServiceInterface } from "../refactor/interface/platform.interface.js";
import { ChatMessage } from '../models/chat.message.model.js';
import { UserInfo } from '../models/user.info.model.js';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service.js';
import type { Iresponse } from "../refactor/interface/message.interface.js";
import { commonResponseMessageFormat } from "./common.response.format.object.js";
import { EntityManagerProvider } from "./entity.manager.provider.service.js";

@scoped(Lifecycle.ContainerScoped)
export class CustomWelcomeService {

    public res;

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider){}

    async checkSession(userId:any){
        const sessionObj = {
            sessionFlag : "nosession"
        };
        const chatMessageRepository = (
            await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
        ).getRepository(ChatMessage);
        const prevSessions = await chatMessageRepository.findAll({
            where : {
                userPlatformID : userId,
            }
        });
        if (prevSessions.length > 1){
            const UserInfoRepository = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(UserInfo);
            const infoProvided = await UserInfoRepository.findOne({
                where : {
                    userPlatformID : userId
                }
            });
            if (infoProvided) {
                if (infoProvided.dataValues.infoProvided) {
                    sessionObj.sessionFlag = "info";
                } else {
                    sessionObj.sessionFlag = "noinfo";
                }
            } else {
                sessionObj.sessionFlag = "noinfo";
            }
            return sessionObj;
        } else {
            return sessionObj;
        }
    }

    async getImageUrl(){
        const url = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("WELCOME_IMAGE_URL");
        return url;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleMessageCustom(sessionId: any, client: any, req: any) {
        console.log('Here in the handle message of custom welcome service');
    }

    async postResponseCustom(userId: any, client: any, data: any) {
        console.log("Sending calorie data to client");

        // this._platformMessageService = container.resolve(client);
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = client;
        response_format.sessionId = userId;
        response_format.messageBody = data;
        response_format.message_type = "image";
        await this._platformMessageService.SendMediaMessage(response_format,null);
    }

}
