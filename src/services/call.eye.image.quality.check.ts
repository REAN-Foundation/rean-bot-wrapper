import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { getRequestOptions } from '../utils/helper';
import needle from "needle";
import path from 'path';
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from 'tsyringe';
import { AwsS3manager } from "./aws.file.upload.service";
import { ChatMessage } from '../models/chat.message.model';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { NeedleService } from '../services/needle.service';
import { Logger } from '../common/logger';

@scoped(Lifecycle.ContainerScoped)
export class CallEyeImageQualityCheckModel {

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
    @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
    @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting) { }

    async  getEyeImageQualityCheckModelResponse(imagePathFromDF,eventObj) {
        // eslint-disable-next-line max-len
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const respChatMessage = await chatMessageRepository.findAll({ where: { "messageContent": imagePathFromDF, "direction": "In" } });
        const eyeQualityCheckModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("EYE_QUALITY_IMAGE_URL");
        const REQUEST_AUTHENTICATION =  this.clientEnvironmentProviderService.getClientEnvironmentVariable("REQUEST_AUTHENTICATION");
        const cloudFrontPath = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("LVPEI_Data_CLOUD_FRONT_PATH");
        const parameters = eventObj.body.queryResult.parameters;
        let goodQuality = false;
        const filename = path.basename(parameters.imageUrl);
        const filePath =  `./photo/` + filename;
        const options = await getRequestOptions();
        options.headers["Authorization"] = `Bearer ${REQUEST_AUTHENTICATION}`;
        options.headers["Content-Type"] = `application/json`;
        const imagePath = respChatMessage[respChatMessage.length - 1].imageUrl;
        const obj = {
            "imagePath" : imagePath
        };
        const response = await needle("post", eyeQualityCheckModelUrl, obj,options);
        let message = null;
        if (response.statusCode === 200) {
            console.log("got results successfully");
            
            if (response.body.result)
            {
                message = "It is a *Good Quality* image as " + response.body.message  ;
                goodQuality = true;
            }
            else {
                message = "It is a *Bad Quality* image as " + response.body.message + "\n Would you like to resend image?";
            }
        }
        else
        {
            console.log("Failed to get response from API.", response.statusCode);
            message = "request is not fullfilled";
        }
        this.backingImage(message,filename, cloudFrontPath,filePath);
        return [message, goodQuality];

    }

    async backingImage(message,fileName, cloudFrontPath,filePath){
        const newMessage = message.replace(/ /g, "_");
        const newfileName = newMessage + "_" + fileName;
        await this.awsS3manager.uploadFile(filePath,process.env.BUCKET_NAME, cloudFrontPath,newfileName);

    }

    sendMessageToTelegram = async(message,eventObj) => {
        try {
            const needleService: NeedleService = eventObj.container.resolve(NeedleService);
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const postData = {
                chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
                text    : message
            };
            const endPoint = `sendMessage`;
            await needleService.needleRequestForTelegram("post",endPoint,postData,payload);
        }
        catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'error in sending message to telegram');
        }
    
    };

}
