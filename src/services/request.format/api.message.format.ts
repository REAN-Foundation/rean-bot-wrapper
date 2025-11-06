import type { IApiRequestMessageEntities } from './api.request.interface.js';

export class Message implements IApiRequestMessageEntities {

    constructor(list) { this.list = list; }

    private list;

    getType() {
        const currentListOfTypes = ["text","reaction","location","image","interactive","voice","audio","button"];
        const type = currentListOfTypes.includes(this.list.type) ? this.list.type : undefined;
        if (type === "interactive") {
            return this.list.interactive.type ? this.list.interactive.type : "interactive";
        }
        else {
            return type;
        }
    }

    getContextId() {
        console.log(this.list);
        if (this.list.context){
            return this.list.context.id;
        }
        else {
            return null;
        }
    }

    getText() {
        const text:string = this.list.text.body;
        return text;
    }

    getChatId() {
        const chat_message_id: string = this.list.id;
        return chat_message_id;
    }

    getUserId() {
        const userId: string = this.list.contacts[0].id;
        return userId;
    }

    getReaction() {
        const reaction = {
            emoji     : this.list.reaction.emoji,
            messageId : this.list.reaction.message_id };
        return reaction;
    }

    getImageId() {
        const image = this.list.image.link;
        return image;
    }

    getLocation() {
        const location = {
            latitude  : this.list.location.latitude,
            longitude : this.list.location.longitude
        };
        return location;
    }

    getVoiceId() {
        const type = this.list.type;
        const voiceId = this.list[type].link;
        return voiceId;
    }

    getAudioId() {
        const audioId = this.list.audio.link;
        return audioId;
    }

    getinteractivebutton() {
        const interactiveButton = {
            title : this.list.interactive.button_reply.title,
            id    : this.list.interactive.button_reply.id
        };
        return interactiveButton;
    }

    getTemplateReplyButton() {
        const interactiveReplyButton = {
            title : this.list.button.text,
            id    : this.list.button.payload
        };
        return interactiveReplyButton;
    }

    getinteractivelist() {
        const interactiveList = {
            title       : this.list.interactive.list_reply.title,
            id          : this.list.interactive.list_reply.id,
            description : this.list.interactive.list_reply.description
        };
        return interactiveList;
    }

    getChannel() {
        return "api";
    }

    setChannel(channel) {
        this.list.channel = channel;
    }

}
