import { autoInjectable, Lifecycle, scoped } from "tsyringe";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import { ChatMessage } from '../models/chat.message.model';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { Iresponse } from "../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";

@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class CustomWelcomeService {

    public res;

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        private _platformMessageService?: platformServiceInterface){}

    async checkSession(userId:any){
        const prevSessions = await ChatMessage.findAll({
            where : {
                userPlatformID : userId,
            }
        });
        if (prevSessions.length > 1){
            return true;
        } else {
            return false;
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
