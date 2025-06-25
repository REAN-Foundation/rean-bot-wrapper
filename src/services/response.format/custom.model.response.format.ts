/* eslint-disable max-len */
import { Lifecycle, scoped, inject } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class CustomModelResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    ){}

    getText() {

        //get text. improve this method after deciding a json format for custom ML model response
        if (this.response.body && this.response.body.answer) {
            return [this.response.body.answer];
        } else {

            // Handle the case where there is an error in the response body
            const errorMessage = ["I am currently unable to process your request. You can try the following options: \n 1.Rephrase the question and resend it. \n 2.Attempt again in a few seconds as the server might be busy. \n 3.If neither of the above options works, please contact our support.\nI apologize for any inconvenience."];
            return errorMessage;
        }
    }

    getImageObject() {
        const image = { url: "",caption: "" };
        console.log("no image");
        return image;
    }

    getIntent(){

        //get intent
        let intent;
        // if (this.response.body && this.response.body.source_of_info){
        //     intent = this.response.body.intent + '|' + this.response.body.source_of_info;
        // } else if (this.response.body && !this.response.body.source_of_info){
        //     intent = this.response.body.intent;
        if (this.response.body) {
            intent = this.response.body.intent;
        } else {
            intent = "Failed Intent";
        }
        return intent;
    }

    getPayload() {
        const payload = this.response.payload ? this.response.payload : null;
        return payload;
    }

    getParseMode(){
        const parse_mode = null;
        return parse_mode;
    }

    getSimilarDoc(){

        if (this.response.body && this.response.body.similar_docs) {
            return [this.response.body.similar_docs];
        } else {
            return null;
        }
    }

}
