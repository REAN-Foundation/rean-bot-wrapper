/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import needle from "needle";
import { scoped, Lifecycle } from "tsyringe";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { CustomModelResponseFormat } from "./response.format/custom.model.response.format";
import { Imessage } from "../refactor/interface/message.interface";
import { CacheMemory } from "./cache.memory.service";
import { ChatBotController } from '../api/controllers/chat.bot.controller';
import { workflowInterface } from '../refactor/interface/wrokflow.interface';
import { Loader } from '../startup/loader';
const express = require('express');

@scoped(Lifecycle.ContainerScoped)
export class CustomMLModelResponseService{

    private _executeWorkflow?: workflowInterface;

    constructor(private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        private chatBotController?:ChatBotController){}

    getCustomModelResponse = async(message: string, platform: string = null, completeMessage:Imessage = null) =>{
        let customModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("CUSTOM_ML_MODEL_URL");
        const verticleCache = await CacheMemory.get(completeMessage.platformId);
        if(verticleCache){
            if (verticleCache.hasOwnProperty("verticleComplete")){
                if(verticleCache.verticleComplete === false){
                    let verticle = verticleCache.verticle
                    verticle.toLowerCase()
                    customModelUrl = `${customModelUrl}/${verticle}`
                }
                else{
                    customModelUrl = `${customModelUrl}/intent_identifier`
                }
            }
            else{
                customModelUrl = `${customModelUrl}/intent_identifier`
            }
            
        }
        else{
            customModelUrl = `${customModelUrl}/intent_identifier`
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
        
        if(callCustomModel.statusCode === 200){
            const customModelResponseFormat = new CustomModelResponseFormat(callCustomModel);
            const verticle_complete = customModelResponseFormat.getVerticleFlag();
            const verticle = customModelResponseFormat.getVerticle();
            CacheMemory.set(completeMessage.platformId, { "verticle" : verticle, "verticleComplete" : verticle_complete });
            console.log("cache", CacheMemory.get(completeMessage.platformId))
            if(!verticle_complete){
                return customModelResponseFormat
            }
            else{
                if(customModelResponseFormat.getworkflowflag()){
                    //start the wrokflow
                    // const payload = {
                    //     "userId" : completeMessage.platformId,
                    //     "userName"
                    // }
                    // customModelResponseFormat.
                    
                    this._executeWorkflow = Loader.container.resolve(verticle);
                    const steps = ["initiateDelete","getReminderDetails","deleteRemider"]
                    await this._executeWorkflow.startWorkflow(verticle,completeMessage.platformId,steps)
                    await this._executeWorkflow.next(completeMessage)

                }
                else{
                    //call llm service listener and then create a response format that is same for all
                    const request = { body : { queryResult : { intent : { displayName : verticle } }, data:  callCustomModel.body.data, payload: completeMessage } }
                    const response = {
                        statusCode: 200,
                        body: null,
                        
                        status(code) {
                        this.statusCode = code;
                        return this;
                        },
                    
                        send(message) {
                        this.body = message;
                        return this;
                        }
                    };
                    this.chatBotController.processIntent(request, response)
                }
            }
        }
        else{
            throw new Error(`Error: ${callCustomModel.statusCode}`)
        }
        
    };

}
