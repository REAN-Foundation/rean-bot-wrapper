/* eslint-disable max-len */
import { Lifecycle, scoped } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";

@scoped(Lifecycle.ContainerScoped)
export class CustomModelResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response){}

    getText() {

        //get text. improve this method after deciding a json format for custom ML model response
        if (this.response.body.data && this.response.body.data.hasOwnProperty('bot')) {
            return [this.response.body.data.bot];
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

    getIntent() {

        //get intent
        let intent;
        if (this.response.body && this.response.body.source_of_info){
            intent = this.response.body.intent + '|' + this.response.body.source_of_info;
        } else if (this.response.body && !this.response.body.source_of_info){
            intent = this.response.body.intent;
        } else {
            intent = "Failed Intent";
        }
        return intent;
    }

    getPayload() {
        let payload = null;
        if (this.response.body.data && this.response.body.data.hasOwnProperty('payload')) {
            payload =  this.response.body.data.payload;
        }
        return payload
    }

    getParseMode() {
        const parse_mode = null;
        return parse_mode;
    }

    getSimilarDoc() {

        if (this.response.body && this.response.body.similar_docs) {
            return [this.response.body.similar_docs];
        } else {
            return null;
        }
    }

    getVerticleFlag() {

        if (this.response.body.data && this.response.body.data.hasOwnProperty('verticle_complete')) {
            return this.response.body.data.verticle_complete;
        } else {
            throw new Error("Verticle flag not found")
        }
    }

    getVerticle() {

        if (this.response.body.data && this.response.body.data.hasOwnProperty('verticle')) {
            return this.response.body.data.verticle;
        } else {
            throw new Error("Verticle missing")
        }
    }

    eventObjectEntities() {

        if (this.response.body.data && this.response.body.data.hasOwnProperty('entities')){
            const entities = this.response.body.data.entities
            return {
                body : {
                    queryResult : {
                        parameters : entities
                    }
                }
            }
        }
        
    }

    getworkflowflag() {
        if (this.response.body.data && this.response.body.data.hasOwnProperty('workflow')) {
            return this.response.body.data.workflow;
        }
    }

}
