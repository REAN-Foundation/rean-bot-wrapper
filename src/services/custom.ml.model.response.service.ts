/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import needle from "needle";
import { scoped, Lifecycle } from "tsyringe";
import { getRequestOptions } from "../utils/helper";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { CustomModelResponseFormat } from "./response.format/custom.model.response.format";
import { DialogflowResponseService } from "./dialogflow.response.service";
import { Imessage } from "../refactor/interface/message.interface";

@scoped(Lifecycle.ContainerScoped)
export class CustomMLModelResponseService{

    constructor(private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        private dialogflowResponseService?:DialogflowResponseService){}

    getCustomModelResponse = async(message: string, platform: string = null, completeMessage:Imessage = null) =>{
        const customModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CUSTOM_ML_MODEL_URL");
        const obj = { "Question": message };
        const options = getRequestOptions();
        
        // send authorisation once enabled for the custom model
        // const requestAuthentication = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REQUEST_AUTHENTICATION");
        // options.headers["Authorization"] = `Bearer ${requestAuthentication}`;
        options.headers["Content-Type"] = `application/json`;

        //call the model
        const callCustomModel = await needle("post",customModelUrl,obj,options);
        const customModelResponseFormat = new CustomModelResponseFormat(callCustomModel);
        const text = customModelResponseFormat.getText();
        return customModelResponseFormat;

        // const response = await this.dialogflowResponseService.getDialogflowMessage(text.answer, platform, text.intent, completeMessage);
        // return response;

    };

}
