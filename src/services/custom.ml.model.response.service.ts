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
import { TenantSettingService } from "./tenant.setting/tenant.setting.service";
import { ContactList } from "../models/contact.list";
import { BlockUserService } from "./block.user.service";
import { ClickUpTask } from "./clickup/clickup.task";

@scoped(Lifecycle.ContainerScoped)
export class CustomMLModelResponseService{

    constructor(private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(SystemGeneratedMessagesService) private systemGeneratedMessages?: SystemGeneratedMessagesService,
        @inject(BlockUserService) private blockUserService?: BlockUserService,
        @inject(ClickUpTask) private clickUpTask?: ClickUpTask,
        private dialogflowResponseService?:DialogflowResponseService){}

    getCustomModelResponse = async(message: string, platform: string = null, completeMessage:Imessage = null) =>{
        const mlSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("ml");
        const customModelUrl = mlSecrets.CustomMlModelUrl;
        const tenantDisplayCode = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("Name");

        const repository = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
        const UserInfoRepository = (
            await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
        ).getRepository(UserInfo);
        const ContactListRepository = (
            await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
        ).getRepository(ContactList);

        const contactList = await ContactListRepository.findOne({
            where : {
                mobileNumber : completeMessage.platformId
            }
        });

        const patientUserId = contactList.dataValues.patientUserId;

        const infoProvided = await UserInfoRepository.findOne({
            where : {
                userPlatformID : completeMessage.platformId
            }
        });

        if (infoProvided) {
            if (infoProvided.dataValues.infoProvided) {
                const userInfo = infoProvided.dataValues.userInfo;
                const addUserInfo = `User information: ${userInfo} || User Question: `;
                message =  addUserInfo + message;
            } else {
                message = "User Question: " + message;
            }
        }

        const tenantId = await TenantSettingService.getTenantId(
            tenantDisplayCode,
            process.env.REANCARE_API_KEY,
            process.env.REAN_APP_BACKEND_BASE_URL
        );
        const obj = {
            "userID"              : completeMessage.platformId,
            "user_query"          : message,
            "tenant_display_code" : tenantDisplayCode,
            "tenant_id"           : tenantId,
            "patient_user_id"     : patientUserId
        };

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

        // Handle block_status flag returned by the custom ML model (FastAPI sends a real boolean)
        await this.handleBlockStatus(callCustomModel, completeMessage.platformId, contactList);

        const addFeedbackMessageSetting = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("AddFeedbackMessageFlag");
        const feedbackAdded: boolean = addFeedbackMessageSetting?.Value === "True";
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

    // Adds the user to the block list and tags their ClickUp ticket when the custom ML model flags them.
    private handleBlockStatus = async (callCustomModel, userPlatformId: string, contactList) => {
        try {
            if (callCustomModel?.body?.block_status !== true) {
                return;
            }
            await this.blockUserService.blockUser(userPlatformId);
            const cmrChatTaskID = contactList?.dataValues?.cmrChatTaskID;
            if (cmrChatTaskID) {
                await this.clickUpTask.updateTagInFeedback(cmrChatTaskID, "Blocked");
            } else {
                console.log(`Block tag skipped for ${userPlatformId}: no cmrChatTaskID found`);
            }
        } catch (error) {
            console.log("Error while handling block status from custom ML model", error);
        }
    };

}
