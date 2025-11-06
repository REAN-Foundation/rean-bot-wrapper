import { Message } from "./whatsapp.wati.message.format.js";

export class WhatsappWatiRequest {

    constructor(list) {
        this.list = list;
    }

    private list;

    *getMessages () {
        const messages = [this.list];
        for (const message of messages) {
            yield new Message(message);
        }
    }
}