/* eslint-disable max-len */
import { autoInjectable, inject, Lifecycle, scoped } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import { ChatMessage } from "../../models/chat.message.model";

@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class DialogflowResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,){}

    // setResponse(response){
    //     this.response = response;
    // }

    getText() {
        const text = [];
        if (this.response[0].queryResult.fulfillmentMessages[0].platform && this.response[0].queryResult.fulfillmentMessages[0].platform === "TELEGRAM" && this.response[0].queryResult.fulfillmentMessages[0].payload){
            text[0] = this.response[0].queryResult.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.text.stringValue;
            if (this.response[0].queryResult.fulfillmentMessages[1]){
                if (this.response[0].queryResult.fulfillmentMessages[1].text){
                    text[1] = this.response[0].queryResult.fulfillmentMessages[1].text.text[0];
                }
            }
        }
        else if (this.response[0].queryResult.fulfillmentMessages[0] && this.response[0].queryResult.fulfillmentMessages[0].text){
            text[0] = this.response[0].queryResult.fulfillmentMessages[0].text.text[0];
        }
        else {
            text[0] = "Sorry, something went wrong. Let me consult an expert and get back to you.";
        }
        return text;
    }

    getImageObject() {
        let image = { url: "",caption: "" };
        if (this.response[0].queryResult.fulfillmentMessages[0].platform && this.response[0].queryResult.fulfillmentMessages[0].platform === "TELEGRAM" && this.response[0].queryResult.fulfillmentMessages[0].payload){
            if (this.response[0].queryResult.fulfillmentMessages[1]){
                if (this.response[0].queryResult.fulfillmentMessages[1].image){
                    image = this.response[0].queryResult.fulfillmentMessages[1].image.imageUri;
                }
            }
        }
        else if (this.response[0].queryResult.fulfillmentMessages[1] && this.response[0].queryResult.fulfillmentMessages[1].image){
            image = { url: this.response[0].queryResult.fulfillmentMessages[1].image.imageUri, caption: this.response[0].queryResult.fulfillmentMessages[1].image.accessibilityText };
        }
        else {
            console.log("no image");
        }
        
        return image;
    }

    getIntent(){
        const intent = this.response[0].queryResult && this.response[0].queryResult.intent ? this.response[0].queryResult.intent.displayName : '';
        return intent;
    }

    getPayload() {
        let payload = null;
        if (this.response[0].queryResult.fulfillmentMessages.length > 1) {
            if (this.response[0].queryResult.fulfillmentMessages[1].payload !== undefined) {
                payload = this.response[0].queryResult.fulfillmentMessages[1].payload;
            }
        }
        return payload;
    }

    getParseMode(){
        let parse_mode = null;
        if (this.response[0].queryResult.fulfillmentMessages[0].platform && this.response[0].queryResult.fulfillmentMessages[0].platform === "TELEGRAM" && this.response[0].queryResult.fulfillmentMessages[0].payload) {
            if (this.response[0].queryResult.fulfillmentMessages[1]){
                if (this.response[0].queryResult.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue && this.response[0].queryResult.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue === 'HTML') {
                    parse_mode = this.response[0].queryResult.fulfillmentMessages[0].payload.fields.telegram.structValue.fields.parse_mode.stringValue;
                }
            }
        }
        return parse_mode;
    }

    getConfidenceScore(){
        let confidenceScore = null;
        if (this.response[0].queryResult.intentDetectionConfidence){
            confidenceScore = this.response[0].queryResult.intentDetectionConfidence;
        } else {
            confidenceScore = 0;
        }
        return confidenceScore;
    }

    getResponses(){
        return this.response;
    }

    async updateConfidenceScore(userPlatformId){
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        const resp = await chatMessageRepository.findAll({ where: { userPlatformID: userPlatformId } });
        const previousIntent = resp[resp.length - 2].intent;
        const currentIntentName = await this.response[0].queryResult && this.response[0].queryResult.intent ? this.response[0].queryResult.intent.displayName : '';
        if (previousIntent === currentIntentName) {
            this.response[0].queryResult.intentDetectionConfidence = 1;
        }
    }

}
