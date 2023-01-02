import { Message } from "./telegram.message.format";

export class TelegramRequest {

    constructor(reqBody) {
        this.reqBody = reqBody;
    }

    private reqBody;

    *getMessage () {
        const messages = [this.reqBody];
        for (const message of messages) {
            console.log("message", message);
            yield new Message(message);
        }
    }

}
