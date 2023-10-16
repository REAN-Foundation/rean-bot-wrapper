/* eslint-disable max-len */
import { Lifecycle, scoped } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";

@scoped(Lifecycle.ContainerScoped)
export class CustomModelResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response){}

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

        //get image
        return null;
    }

    getIntent(){

        //get intent
        return null;
    }

    getPayload() {

        //get payload
        return null;
    }

    getParseMode(){

        //get parse mode
    }

}
