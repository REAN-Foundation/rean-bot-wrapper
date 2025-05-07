import { Contacts } from "./api.contact.format";
import { Message } from "./api.message.format";

export class ApiRequest {

    constructor(list) {
        this.list = list;
    }

    private list;

    *getMessages () {
        const messages = this.list.messages;
        for (const message of messages) {
            yield new Message(message);
        }
    }

    *getContacts () {
        const contacts = this.list.contacts;
        for (const contact of contacts) {
            yield new Contacts(contact);
        }

    }

}
