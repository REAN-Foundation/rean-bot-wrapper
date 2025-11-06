import { Message } from "./telegram.message.format.js";

export class TelegramRequest {

    constructor(reqBody) {
        this.reqBody = reqBody;
    }

    private reqBody;

    *getMessage () {
        const messages = [this.reqBody];
        for (const message of messages) {
            yield new Message(message);
        }
    }

}
