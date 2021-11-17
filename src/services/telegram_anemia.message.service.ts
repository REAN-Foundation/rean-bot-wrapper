
// import { DialogflowResponseService } from './dialogflow-response.service';
import { uploadFile, createFileFromHTML } from './aws.file.upload.service';
import { message, response } from '../refactor/interface/message.interface';
import { autoInjectable, singleton } from 'tsyringe';
import  TelegramBot  from 'node-telegram-bot-api';
import { MessageFlow } from './get.put.message.flow.service';
import http from 'https';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Speechtotext } from './speech.to.text.service';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{

    public _telegram: TelegramBot = null;

    public res;

    // public req;
    constructor(private Speechtotext?: Speechtotext, private messageFlow?: MessageFlow ) {
        this._telegram = new TelegramBot(process.env.TELEGRAM_ANEMIA_BOT_TOKEN);
        const client = null;
        this.init(client);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleMessage(msg, client: string){
        this._telegram.processUpdate(msg);
        console.log("message sent to events aa");
        return null;
    }

    init(client){
        this._telegram.setWebHook(process.env.BASE_URL + '/v1/telegramanemia/' + process.env.TELEGRAM_ANEMIA_BOT_TOKEN + '/receive');
        console.log("Telegram webhook set anemia," );
        
        this._telegram.on('message', msg => {
            if(!Array.isArray(msg.photo)){
                this.SendMediaMessage(msg.chat.id.toString(),null,'Please Share Image Only')
                return
            }
            let media = this.GetTelegramMedia(msg.photo[3].file_id);
            media.then((res:any)=>{
                const options = {
                    hostname : process.env.ANEMIA_CHECK_URL,
                    path     : "/?filePath="+'https://api.telegram.org/file/bot' + process.env.TELEGRAM_ANEMIA_BOT_TOKEN + '/' + res.result.file_path,
                    method   : 'GET',
                    headers : {
                        'Content-Type' : 'application/json',
                    }
                };
                const request = http.request(options, (response) => {
                    response.setEncoding('utf8');
                    response.on('data', (res) => {
                        try{
                            res = JSON.parse(res)
                            console.log(res);
                            let ress = res.isAnemic ? 'The Case is Anemic' : 'The Case is not Anemic'
                            this.SendMediaMessage(msg.chat.id.toString(),null,ress)
                        }catch(e){
                            console.log('Error ',e);
                            this.SendMediaMessage(msg.chat.id.toString(),null,'Please try again later')
                        }
                        
                    });
                });
                request.on('error', (e) => {
                    console.error(`problem with request: ${e.message} ${e}`);
                });
                request.end();
            });
        });
    }

    getMessage = async (message) =>{
        console.log("enter the getMessage of telegram", message);
        // eslint-disable-next-line init-declarations
        let returnMessage: message;
        const telegram_id = message.chat.id.toString();
        const name = message.from.first_name;
        const chat_message_id = message.message_id;
        if (message.text) {
            returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: message.text,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'text' };
        }
        else if (message.voice) {
            let response: any = {};
            console.log("this is voice", message.voice);
            response = await this.GetTelegramMedia(message.voice.file_id);
            console.log("response of telegram media is", response);
            const file_path = response.result.file_path;
            if (file_path) {
                const ConvertedToText = await this.Speechtotext.SendSpeechRequest('https://api.telegram.org/file/bot' + process.env.TELEGRAM_ANEMIA_BOT_TOKEN + '/' + response.result.file_path, "telegram");
                if (ConvertedToText) {
                    returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: String(ConvertedToText),sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'voice' };
                } else {
                    returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'text' };
                }
            } else {
                returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: 'text' };
            }
        }
        else if (message.location) {
            const location_message = `latlong:${message.location.latitude}-${message.location.longitude}`;
            returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: location_message,type: 'location' };
        }else if (message.photo) {
            let response: any = {};
            console.log("this is voice", message.photo);
            response = await this.GetTelegramMedia(message.photo[0].file_id);
            console.log("response of telegram media is", response);
            const file_path = response.result.file_path;
            return 'https://api.telegram.org/file/bot' + process.env.TELEGRAM_ANEMIA_BOT_TOKEN + '/' + response.result.file_path;
        }
        else {
            returnMessage = { name: name, platform: "Telegram",chat_message_id: chat_message_id,direction: "In",messageBody: null,sessionId: telegram_id,replayPath: telegram_id,latlong: null,type: message[0].type };
        }
        return returnMessage;
    }

    postResponse = async(message, response) => {
        console.log("enter the give response of tele");
        // eslint-disable-next-line init-declarations
        let reaponse_message: response;
        const telegram_id = message.sessionId;
        const input_message = message.messageBody;
        const name = message.name;
        const chat_message_id = message.chat_message_id;
        const raw_response_object = response.text_part_from_DF.result && response.text_part_from_DF.result.fulfillmentMessages ? JSON.stringify(response.text_part_from_DF.result.fulfillmentMessages) : '';
        const intent = response.text_part_from_DF.result && response.text_part_from_DF.result.intent ? response.text_part_from_DF.result.intent.displayName : '';
        if (response.text_part_from_DF.image && response.text_part_from_DF.image.url) {
            reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: response.text_part_from_DF.image , messageImageCaption: response.text_part_from_DF.image.url, sessionId: telegram_id, messageText: null };
        }
        else if (response.processed_message.length > 1) {

            if (response.text_part_from_DF.parse_mode && response.text_part_from_DF.parse_mode === 'HTML') {
                const uploadImageName = await createFileFromHTML(response.processed_message[0]);
                const vaacinationImageFile = await uploadFile(uploadImageName);
                if (vaacinationImageFile) {
                    reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "image",raw_response_object: raw_response_object,intent: intent,messageBody: String(vaacinationImageFile), messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: response.processed_message[1] };
                }
            }
            else {
                reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: response.processed_message[0] };
                reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: response.processed_message[1] };
            }
        } else {
            reaponse_message = { name: name,platform: "Telegram",chat_message_id: chat_message_id,direction: "Out",input_message: input_message,message_type: "text",raw_response_object: raw_response_object,intent: intent,messageBody: null, messageImageUrl: null , messageImageCaption: null, sessionId: telegram_id, messageText: response.processed_message[0] };
        }
        return reaponse_message;
    }

    SendMediaMessage = async (contact, imageLink = null, message) => {
        message = this.sanitizeMessage(message);
        return new Promise((resolve) => {

            if (imageLink === null){
                this._telegram.sendMessage(contact, message, { parse_mode: 'HTML' }).then(function (data) {
                    resolve(data);
                });
            }
            else this._telegram.sendPhoto(
                contact,
                imageLink,
                { caption: message }
            )
                .then(function (data) {
                    resolve(data);
                });
        });
    }

    GetTelegramMedia = async (fileid) => {

        return new Promise((resolve, reject) => {
            console.log("afgshhhhhhhhhhhhh", process.env.TELEGRAM_MEDIA_PATH_URL + '?file_id=' + fileid);
            const req = http.request(process.env.TELEGRAM_MEDIA_PATH_URL + '?file_id=' + fileid, res => {
                let data = " ";
                res.on('data', d => {
                    data += d;
                });
                res.on("end", () => {
                    resolve(JSON.parse(data));
                });
            });

            req.on('error', error => {
                reject(error);
            });
            req.end();
        });
    };

    sanitizeMessage(message) {
        if (message > 4096) {
            var strshortened = message.slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
            strshortened = strshortened.replace(/(<\/ b>|<\/b>)/mgi, "</b>");
            message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
        }
        return message;
    }

}
