import { message, response } from '../Refactor/interface/interface';
import { autoInjectable, singleton } from 'tsyringe';
import { platformServiceInterface } from '../Refactor/interface/PlatformInterface';
import { MessageFlow } from './GetPutMessageFLow'
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

    // set req(req){
    //     this.req = req;
    // }

    // set res(res){
    //     this.res = res;
    // }

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
        // let countryCode = msg.countryCode;

        if (msg.type == "text") {
            let message = msg.message + ` PhoneNumber is ${phoneNumber}`;
        returnMessage = {messageBody:message,sessionId:phoneNumber,replayPath:phoneNumber,latlong:null,type:'text'}
        return returnMessage;
        }
    }

    postResponse (message, response ){
        // throw new Error('Method not implemented.');
        let reansupport_Id = message.Id;
        let reaponse_message = {messageBody:null, messageImageUrl:null , messageImageCaption: null, sessionId: reansupport_Id, messageText:response.processed_message[0]};
        return reaponse_message;
    
    }

    SendMediaMessage(contact,imageLink, message){
        // throw new Error('Method not implemented.');
        this.responseHandler.sendSuccessResponseForApp(this.res, 201, "Message processed successfully.", { response_message: message });
        return message;


    }

    // sendSuccessResponseForApp = (response, code, message, data, log_data = false) => {
    //     let obj = {
    //         success: true,
    //         message: message,
    //         data: data ? data : {}
    //     }
    //     if (log_data) {
    //         this.logger.log_info(JSON.stringify(obj))
    //     }
    //     return response.status(code).send(obj)
    // }

}