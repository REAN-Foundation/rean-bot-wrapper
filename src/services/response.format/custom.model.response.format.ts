/* eslint-disable max-len */
import { Lifecycle, scoped } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";

@scoped(Lifecycle.ContainerScoped)
export class CustomModelResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response){}

    getText() {

        //get text. improve this method after deciding a json format for custom ML model response
        return [this.response.body.answer? this.response.body.answer: "Server seems to be busy. Please try in few seconds"];
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
