/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { getMessageFunctionalities } from "../refactor/interface/message.service.functionalities.interface";
import { Imessage } from '../refactor/interface/message.interface';
import { Lifecycle, inject, scoped } from "tsyringe";
import { EmojiFilter } from './filter.message.for.emoji.service';
import { Message } from './request.format/whatsapp.message.format';
import { MessageFunctionalities } from "./whatsapp.functionalities";
import { AwsS3manager } from "./aws.file.upload.service";


@scoped(Lifecycle.ContainerScoped)
export class MockCHannelMessageFunctionalities implements getMessageFunctionalities {

    constructor(
        @inject(EmojiFilter) private emojiFilter?: EmojiFilter,
        @inject(MessageFunctionalities) private formatter?: MessageFunctionalities,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
    ){}

    async locationMessageFormat(messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const loc = `latlong:${messageObj.getLocation().latitude}|${messageObj.getLocation().longitude}`;
        messagetoDialogflow.type = 'location';
        messagetoDialogflow.latlong = messageObj.getLocation();
        messagetoDialogflow.messageBody = loc;
        return messagetoDialogflow;
    }

    async voiceMessageFormat(messageObj: Message) {
        const mediaUrl = messageObj.audio?.link;
        // const mediaUrl = await this.formatter.GetWhatsappMedia('audio', messageObj.getVoiceId(), '_voice.ogg');
        const localFilePath = await this.getMediaFromRequest(mediaUrl, 'audio', '_voice.ogg');
        return await this.formatter.commonVoiceAudioFormat(messageObj, mediaUrl);
    }

    async audioMessageFormat (messageObj: Message) {
        // eslint-disable-next-line init-declarations
        let audioFilePath = '';
        if (messageObj.getChannel() === "whatsappMeta") {
            const audioUrlsentByMeta = await this.formatter.getMetaMediaUrl(messageObj.getAudioId());
            audioFilePath = await this.formatter.GetWhatsappMetaMedia('audio', audioUrlsentByMeta, '_voice.ogg');
        } else {
            audioFilePath = await this.formatter.GetWhatsappMedia('audio', messageObj.getAudioId(), '_voice.ogg');
        }
        return await this.formatter.commonVoiceAudioFormat(messageObj, audioFilePath);
    }

    async reactionMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const reaction = messageObj.getReaction();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(reaction.emoji);
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        messagetoDialogflow.messageBody = reaction.emoji;
        messagetoDialogflow.type = 'reaction';
        messagetoDialogflow.contextId = reaction.messageId;
        return messagetoDialogflow;
    }

    async textMessageFormat (messageObj: Message) {
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        const text = messageObj.getText();
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(text);
        messagetoDialogflow.messageBody = text;
        if (emojiFilteredMessage === "NegativeFeedback"){
            messagetoDialogflow.intent = "NegativeFeedback";
        }
        messagetoDialogflow.contextId = messageObj.getContextId();
        return messagetoDialogflow;
    }

    async interactiveListMessageFormat(messageObj: Message){
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getinteractivelist().title);
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = emojiFilteredMessage;
        messagetoDialogflow.intent = messageObj.getinteractivelist().id;
        return messagetoDialogflow;
    }

    async list_replyMessageFormat(messageObj: Message){
        const emojiFilteredMessage = await this.emojiFilter.checkForEmoji(messageObj.getinteractivelist().title);
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = emojiFilteredMessage;
        messagetoDialogflow.intent = messageObj.getinteractivelist().id;
        const description = messageObj.getinteractivelist().description;

        //need to change the structure of messagetoDialogflow such that it considers description when message type is list. the below loop is just a temporary measure to make get description in delete reminders
        if (description){
            messagetoDialogflow.messageBody = description + ',' + emojiFilteredMessage;
        }
        return messagetoDialogflow;
    }

    async button_replyMessageFormat(messageObj: Message){
        const message = messageObj.getinteractivebutton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = message;
        messagetoDialogflow.intent = messageObj.getinteractivebutton().id;
        return messagetoDialogflow;
    }

    async buttonMessageFormat(messageObj: Message){
        const message = messageObj.getTemplateReplyButton().title;
        const messagetoDialogflow = this.inputMessageFormat(messageObj);
        messagetoDialogflow.messageBody = message;
        messagetoDialogflow.intent = messageObj.getTemplateReplyButton().id;
        return messagetoDialogflow;
    }

    async imageMessageFormat(messageObj: Message) {
        const imageUrl = messageObj.image?.link;
        //let imageFilePath = '';
        // if (messageObj.getChannel() === 'whatsapp'){
        //     imageFilePath = await this.formatter.GetWhatsappMedia('photo', messageObj.getImageId(), '.jpg');
        // }
        // else {
        //     const imageUrlSentByMeta = await this.formatter.getMetaMediaUrl(messageObj.getImageId());
        //     imageFilePath = await this.formatter.GetWhatsappMetaMedia('photo', imageUrlSentByMeta, '.jpg');
        // }
        const imageFilePath = this.getMediaFromRequest(imageUrl, 'photo', '.jpg');
        const location = await this.awsS3manager.uploadFile(imageFilePath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const url = require('url');
        const urlParse = url.parse(location);
        const imageUrlInResponse = (urlParse.protocol + urlParse.hostname + urlParse.pathname);
        if (imageFilePath){
            const messagetoDialogflow = this.inputMessageFormat(messageObj);
            messagetoDialogflow.type = 'image';
            messagetoDialogflow.messageBody = imageUrlInResponse;
            messagetoDialogflow.imageUrl = location;
            return messagetoDialogflow;
        } else {
            throw new Error("Unable to find the image file path");
        }
        
    }

    async getMediaFromRequest(mediaUrl: string, type: string, extension: string): Promise<string> {
        const needle = require('needle');
        const fs = require('fs');
        const path = require('path');
    
        const dir = path.join(__dirname, type);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    
        const filename = `${Date.now()}${extension}`;
        const fullPath = path.join(dir, filename);
        const writeStream = fs.createWriteStream(fullPath);
    
        await new Promise((resolve, reject) => {
            needle.get(mediaUrl)
                .pipe(writeStream)
                .on('finish', resolve)
                .on('error', reject);
        });
    
        return fullPath;
    }    

    inputMessageFormat (messageObj){
        const messagetoDialogflow: Imessage = {
            name              : null,
            platform          : messageObj.getChannel(),
            chat_message_id   : null,
            direction         : "In",
            messageBody       : null,
            imageUrl          : null,
            platformId        : null,
            replyPath         : null,
            latlong           : null,
            type              : "text",
            intent            : null,
            responseMessageID : null,
            contextId         : null,
        };
        messagetoDialogflow.chat_message_id = messageObj.getChatId();
        return messagetoDialogflow;
    }

}
