/* eslint-disable @typescript-eslint/no-unused-vars */
import { autoInjectable,container } from "tsyringe";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import { ChatMessage } from '../models/chat.message.model';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@autoInjectable()
export class CustomWelcomeService {

    public res;

    private _platformMessageService?: platformServiceInterface;

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

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

    async handleMessageCustom(sessionId: any, client: any, req: any) {
        console.log('Here in the handle message of custom welcome service');
    }

    async postResponseCustom(userId: any, client: any, data: any) {
        console.log("Sending calorie data to client");
        this._platformMessageService = container.resolve(client);
        await this._platformMessageService.SendMediaMessage(userId,data,null,'image',null);
    }

}
