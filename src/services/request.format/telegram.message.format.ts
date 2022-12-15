import { ItelegramMessageEntities } from './telegram.request.interface';

export class Message implements ItelegramMessageEntities {

    constructor(reqBody) {this.reqBody = reqBody;}

    private reqBody;

    getUserId() {
        return this.reqBody.chat.id.toString();
    }

    getUsername() {
        return this.reqBody.from.first_name;
    }

    getChatId() {
        return this.reqBody.message_id;
    }

    isType(type:string) {
        console.log(this.reqBody);
        if (this.reqBody[type]){
            return true;
        }
        else {
            return false;
        }
    }

    getText() {
        return this.reqBody.text;
    }

    getContextId() {
        if (this.reqBody.reply_to_message) {
            return this.reqBody.reply_to_message.message_id;
        }
        else {
            return null;
        }
    }

    getLocation() {
        const location = {
            latitude  : this.reqBody.location.latitude,
            longitude : this.reqBody.location.longitude
        };
        return location;
    }

    getVoiceFileId() {
        return this.reqBody.voice.file_id;
    }

    getPhotoFileId() {
        return (this.reqBody.photo[(this.reqBody.photo).length - 1].file_id);
    }

    getdocumentFileId() {
        return (this.reqBody.document.file_id);
    }
    
}