import { IWhatsappRequestMessageEntities } from './whatsapp.request.interface';

export class Message implements IWhatsappRequestMessageEntities {

    constructor(list) { this.list = list; }

    private list;

    getType() {
        const currentListOfTypes = ["text","reaction","location","image","interactive","voice","audio"];
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
        const userId: string = this.list.from;
        return userId;
    }

    getReaction() {
        const reaction = {
            emoji     : this.list.reaction.emoji,
            messageId : this.list.reaction.message_id };
        return reaction;
    }

    getImageId() {
        const image = this.list.image.id;
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
        const voiceId = this.list[type].id;
        return voiceId;
    }

    getAudioId() {
        const audioId = this.list.audio.id;
        return audioId;
    }

    getinteractivebutton() {
        const interactiveButton = {
            title : this.list.interactive.button_reply.title,
            id    : this.list.interactive.button_reply.id
        };
        return interactiveButton;
    }

    getinteractivelist() {
        const interactiveList = {
            title : this.list.interactive.list_reply.title,
            id    : this.list.interactive.list_reply.id
        };
        return interactiveList;
    }

}
