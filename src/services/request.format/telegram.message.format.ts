/* eslint-disable init-declarations */
import { ItelegramMessageEntities } from './telegram.request.interface';

export class Message implements ItelegramMessageEntities {

    constructor(reqBody) { this.reqBody = reqBody; }

    private reqBody;

    getUserId() {
        if (this.isReplyMarkup()){
            return this.reqBody.message.chat.id.toString();
        }
        else {
            return this.reqBody.chat.id.toString();
        }
    }

    getUsername() {
        return this.reqBody.from.first_name;
    }

    getChatId() {
        if (this.isReplyMarkup()){
            return this.reqBody.message.message_id;
        }
        return this.reqBody.message_id;
    }

    getType() {
        const currentListOfTypes = ["text","location","photo","voice","document","inline_keyboard"];
        let type;
        for (const ele of currentListOfTypes) {
            if (this.isType(ele)){
                type = ele;
                break;
            }
        }
        return type;
    }

    isType(type:string) {
        console.log(this.reqBody);
        if (this.reqBody[type]){
            return true;
        }
        else if (this.isReplyMarkup()){
            if (this.reqBody.message.reply_markup[type]){
                return true;
            }
        }
        else {
            return false;
        }
    }

    getText() {
        if (this.isReplyMarkup()){
            const callback_button_data:string = this.reqBody.data;
            const inline_keyboard_array:any = this.reqBody.message.reply_markup.inline_keyboard;
            for (const list_of_buttons of inline_keyboard_array){
                for (const obj of list_of_buttons){
                    if (obj['callback_data'] === callback_button_data){
                        return obj['text'];
                    }
                }
            }
            return this.reqBody.message.text;
        }
        else {
            return this.reqBody.text;
        }
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

    isReplyMarkup() {
        if ("message" in this.reqBody){
            if ("reply_markup" in this.reqBody.message){
                return true;
            }
        }
    }

    getInLineKeyBoardReplyButton() {
        const inLineKeyBoardReplyButton = {
            title : null,
            id    : this.reqBody.data
        };
        const inline_keyboard_array:any = this.reqBody.message.reply_markup.inline_keyboard;
        for (const list_of_buttons of inline_keyboard_array){
            for (const obj of list_of_buttons){
                if (obj['callback_data'] === this.reqBody.data){
                    inLineKeyBoardReplyButton.title = obj['text'];
                }
            }
        }
        return inLineKeyBoardReplyButton;
    }
    
}
