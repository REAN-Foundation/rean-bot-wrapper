/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import needle from "needle";
import { inject, scoped, Lifecycle } from "tsyringe";
import { getRequestOptions } from "../utils/helper";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { CustomModelResponseFormat } from "./response.format/custom.model.response.format";
import { DialogflowResponseService } from "./dialogflow.response.service";
import { Imessage } from "../refactor/interface/message.interface";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { UserInfo } from "../models/user.info.model";
import { SystemGeneratedMessages } from "../models/system.generated.messages.model";
import { SystemGeneratedMessagesService } from "./system.generated.message.service";

@scoped(Lifecycle.ContainerScoped)
export class CustomMLModelResponseService{

    constructor(private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(SystemGeneratedMessagesService) private systemGeneratedMessages?: SystemGeneratedMessagesService,
        private dialogflowResponseService?:DialogflowResponseService){}

    getCustomModelResponse = async(message: string, platform: string = null, completeMessage:Imessage = null) =>{
        const customModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CUSTOM_ML_MODEL_URL");

        const repository = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
        const UserInfoRepository = (
            await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
        ).getRepository(UserInfo);
        
        const infoProvided = await UserInfoRepository.findOne({
            where : {
                userPlatformID : completeMessage.platformId
            }
        });

        if (infoProvided) {
            if (infoProvided.dataValues.infoProvided) {
                const userInfo = infoProvided.dataValues.userInfo;
                const addUserInfo = `User information: ${userInfo} || User Question: `;
                message =  message + addUserInfo ;
            } else {
                message = "User Question: " + message;
            }
        }

        const obj = { "userID": completeMessage.platformId,"user_query": message };

        // send authorisation once enabled for the custom model
        // const requestAuthentication = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REQUEST_AUTHENTICATION");
        // options.headers["Authorization"] = `Bearer ${requestAuthentication}`;
        var headers = {
            'Content-Type' : 'application/json',
            accept         : 'application/json'
        };
        const options = {
            headers : headers,
        };

        //call the model
        const callCustomModel = await needle("post",customModelUrl,obj,options);

        const feedbackAdded: boolean = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ADD_FEEDBACK_MESSAGE") === "true";
        if (feedbackAdded && callCustomModel.body?.answer){
            const feedbackMessageToBeAdded = await this.systemGeneratedMessages.getMessage("FEEDBACK_MESSAGE");
            const messageAfterFeedback = callCustomModel.body.answer +  `

${feedbackMessageToBeAdded}
            `;
            callCustomModel.body.answer = messageAfterFeedback;
        }
        const customModelResponseFormat = new CustomModelResponseFormat(callCustomModel);
        const text = customModelResponseFormat.getText();
        return customModelResponseFormat;

        // const response = await this.dialogflowResponseService.getDialogflowMessage(text.answer, platform, text.intent, completeMessage);
        // return response;

    };

}
