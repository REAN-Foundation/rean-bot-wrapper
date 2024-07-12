import { IWhatsappRequestMessageEntities } from "./whatsapp.request.interface";

export class Message implements IWhatsappRequestMessageEntities {
    
    constructor(list) { this.list = list; }

    private list;

    getType() {
        const currentListOfTypes = ["text", "location", "image", "interactive", "audio", "document", "voice", "sticker", "video", "button" ];
        const type = currentListOfTypes.includes(this.list.type) ? this.list.type : undefined;
        if (type === "interactive") {
            if (this.list.interactiveButtonReply) {
                return "button_reply";
            } else if (this.list.listReply){
                return "list_reply";
            }
        } else {
            return type;
        }
    }

    getContextId() {
        if (this.list.replyContextId) {
            return this.list.replyContextId;
        } else {
            return null;
        }
    }

    getText() {
        const text: string = this.list.text;
        return text;
    }

    getChatId() {
        const chat_message_id: string = this.list.whatsappMessageId;
        return chat_message_id;
    }

    getUserId() {
        const userId: string = this.list.waId;
        return userId;
    }

    getUserName() {
        const userName: string = this.list.senderName;
        return userName;
    }

    getReaction() {
        return null;
    }

    getLocation() {
        return null;
    }

    getImageId() {
        return null;
    }

    getVoiceId() {
        return null;
    }

    getAudiId() {
        return null;
    }

    getinteractivebutton() {
        const interactiveButton = {
            id    : this.list.interactiveButtonReply.id,
            title : this.list.interactiveButtonReply.title
        };
        return interactiveButton;
    }

    getButton() {
        const button = {
            title : this.list.buttonReply.text
        };
        return button;
    }

    getTemplateReplyButton() {
        return null;
    }

    getinteractivelist() {
        const interactiveList = {
            title : this.list.listReply,
        };
        return interactiveList;
    }

    getMediaPath() {
        const mediaUrl = this.list.data;
        const mediaPath = mediaUrl.split('=')[1];
        return mediaPath;
    }

    getChannel() {
        return this.list.channel;
    }

    setChannel(channel) {
        this.list.channel = channel;
    }

}
