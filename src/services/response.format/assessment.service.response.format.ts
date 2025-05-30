import { Lifecycle, scoped } from "tsyringe";
import { IserviceResponseFunctionalities } from "./response.interface";

@scoped(Lifecycle.ContainerScoped)
export class AssessmentResponseFormat implements IserviceResponseFunctionalities{

    constructor(private response){}

    getText() {
        if (this.response.message) {
            return [this.response.message];
        } else {
            const errorMessage = ["There was some error in processing your request."];
            return errorMessage;
        }
    }

    getImageObject() {
        //method to be implemented
    }

    getIntent() {
        let intent;
        if (this.response.intent) {
            intent = this.response.intent;
        } else {
            intent = "AssessmentFailure";
        }
        return intent;
    }

    getPayload() {
        const payload = this.response.payload ? this.response.payload : null;
        return payload;
    }

    getParseMode() {
        const parseMode = null;
        return parseMode;
    }

    getSimilarDoc() {
        //method to be implemented
    }
}