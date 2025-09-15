/* eslint-disable max-len */
import { Lifecycle, scoped } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";

@scoped(Lifecycle.ContainerScoped)
export class OpenAIResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response){}

    getText() {
        const text = [];
        if (this.response.choices[0]?.message?.content){
            text[0] = this.response.choices[0]?.message?.content;
        }
        else {
            text[0] = "Sorry, something went wrong. Let me consult an expert and get back to you.";
        }
        return text;
    }

    getImageObject() {
        const image = { url: "",caption: "" };
        console.log("no image");
        return image;
    }

    getIntent(){
        const intent = "Testing ChatGpt";
        return intent;
    }

    getPayload() {
        const payload = null;
        return payload;
    }

    getParseMode(){
        const parse_mode = null;
        return parse_mode;
    }

    getSimilarDoc(){
        
        //not implemented
        return null;
    }

    getSensitivity() {
        if (this.response.body && this.response.body.sensitivity_flag) {
            return this.response.body.sensitivity_flag;
        } else {
            return null;
        }
    }

}
