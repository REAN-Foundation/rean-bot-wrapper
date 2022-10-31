/* eslint-disable max-len */
import { autoInjectable, singleton } from "tsyringe";
import {IserviceResponseFunctionalities } from "./response.interface";

@autoInjectable()
@singleton()
export class DialogflowResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response){}

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
        let image = {url: "",caption: ""};
        if (this.response[0].queryResult.fulfillmentMessages[0].platform && this.response[0].queryResult.fulfillmentMessages[0].platform === "TELEGRAM" && this.response[0].queryResult.fulfillmentMessages[0].payload){
            if (this.response[0].queryResult.fulfillmentMessages[1]){
                if (this.response[0].queryResult.fulfillmentMessages[1].image){
                    image = this.response[0].queryResult.fulfillmentMessages[1].image.imageUri;
                }
            }
        }
        else if (this.response[0].queryResult.fulfillmentMessages[1] && this.response[0].queryResult.fulfillmentMessages[1].image){
            image = {url: this.response[0].queryResult.fulfillmentMessages[1].image.imageUri, caption: this.response[0].queryResult.fulfillmentMessages[1].image.accessibilityText};
        }
        else {
            console.log("no image");
        }
        
        return image;
    }

    getIntent(){
        const intent = this.response[0].queryResult && this.response[0].queryResult.intent ? this.response[0].queryResult.intent.displayName : '';
        console.log("interface intent", intent);
        return intent;
    }

    getPayload() {
        let payload = null;
        console.log("interface DF response", this.response);
        if (this.response[0].queryResult.fulfillmentMessages.length > 1) {
            if (this.response[0].queryResult.fulfillmentMessages[1].payload !== undefined) {
                payload = this.response[0].queryResult.fulfillmentMessages[1].payload;
            }
        }
        console.log("payload in interface", payload);
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

}