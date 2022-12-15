import { RHGAppRequestBody } from "./rhg.mobile.app.requestbody";

export class RHGRequest {

    constructor(reqBody) {
        this.reqBody = reqBody;
    }

    private reqBody;

    *getMessage () {
        const messages = [this.reqBody];
        for (const message of messages) {
            console.log("message", message);
            yield new RHGAppRequestBody(message);
        }
    }


}