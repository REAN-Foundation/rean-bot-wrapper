import { message } from '../refactor/interface/message.interface'; 
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { MessageFlow } from './get.put.message.flow.service'
import { Logger } from '../common/logger';
import { ResponseHandler } from '../utils/response.handler';

@autoInjectable()
@singleton()
export class platformMessageService implements platformServiceInterface{

    public translate = false;
    public res;
    constructor(private messageFlow?: MessageFlow,private responseHandler?: ResponseHandler,
            ) {

    }

    init() {
        throw new Error('Method not implemented.');
    }

    handleMessage(msg, client) {
        console.log("entered the handle msg in whatsapp msg ser")
        console.log("the msg sent ", msg)
        let response_rean_support = this.messageFlow.get_put_msg_Dialogflow(msg, client, this);
        return response_rean_support;
    }

    getMessage(msg) {
        let returnMessage: message;
        let phoneNumber = msg.phoneNumber.toString();

        if (msg.type == "text") {
            let message = msg.message + ` PhoneNumber is ${phoneNumber}`;
        returnMessage = {name:null,platform:"Rean_Support",chat_message_id:null, direction:"In",messageBody:message,sessionId:phoneNumber,replayPath:phoneNumber,latlong:null,type:'text'}
        return returnMessage;
        }
    }

    postResponse (message, response ){
        let reansupport_Id = message.Id;
        let message_type = response.text_part_from_DF.image_url ? "image" : "text";
        let raw_response_object = response.text_part_from_DF.result && response.text_part_from_DF.result.fulfillmentMessages ? JSON.stringify(response.text_part_from_DF.result.fulfillmentMessages) : '';
        let intent = response.text_part_from_DF.result && response.text_part_from_DF.result.intent ? response.text_part_from_DF.result.intent.displayName : '';
        
        let reaponse_message = {name:null,platform:"Whatsapp",chat_message_id:null,direction:"Out",message_type:message_type,raw_response_object:raw_response_object,intent:intent,messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: reansupport_Id, messageText:response.processed_message[0]};
        return reaponse_message;
    
    }

    SendMediaMessage(contact,imageLink, message){
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: message });
        return message;
    }

}