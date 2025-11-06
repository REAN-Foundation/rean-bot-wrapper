import { RHGAppRequestBody } from "./rhg.mobile.app.requestbody.js";

export class RHGRequest {

    constructor(reqBody) {
        this.reqBody = reqBody;
    }

    private reqBody;

    *getMessage () {
        const messages = [this.reqBody];
        for (const message of messages) {
            yield new RHGAppRequestBody(message);
        }
    }

}
