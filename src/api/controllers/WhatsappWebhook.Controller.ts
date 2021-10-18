import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/Error.Handler';
import { WhatsappMessageService } from '../../services/whatsapp-message.service';
import { Logger } from '../../common/logger';
import { DialogflowResponseService } from '../../services/dialogflow-response.service';
import { translateService } from '../../services/translate'
import { autoInjectable } from 'tsyringe';
import { handlerequest } from '../../Refactor/interface/interface'
import { handleRequestservice } from '../../services/HandleRequest'
// const ConverSpeechToText = require('../services/SpeechToTextService');
// const { isArray } = require('util');


@autoInjectable()
export class WhatsappWebhookController {

    constructor(private whatsappMessageUtility?: WhatsappMessageService,
        private handleRequestservice?: handleRequestservice,
        private translateService?: translateService,
        private responseHandler?: ResponseHandler,
        private errorHandler?: ErrorHandler,
        private dialogflowMessageUtility?: DialogflowResponseService) {

        }
        sendMessage = async (req, res) => {
            console.log("sendMessage webhook")
            try {
                let responce = await this.whatsappMessageUtility.SendWhatsappMessage(req.body.contact, req.body.message);
                // let responce = await this.whatsappMessageUtility.SendWhatsappMediaMessage(req.body.contact,req.body.imageLink, req.body.message);
                if (responce) this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', responce);
                else
                    this.responseHandler.sendFailureResponse(res, 200, 'An error occurred while sending messages!', req);
            }
            catch (error) {
                this.errorHandler.handle_controller_error(error, res, req);
            }
        };
        
        receiveMessage = async (req, res) => {
            console.log("receiveMessage webhook")
            try {
                //to prevent whatsapp from sending duplicate calls, respond emidiately
                this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                if (req.body.statuses) {
                    // status = sent, received & read
                }
                else {
                    let message = await this.whatsappMessageUtility.getMessage(req);
                    let returninterface: handlerequest = {botObject:null, message:message}
                    let responce = await this.handleRequestservice.handleUserRequest(returninterface);
                    let response_format = await this.whatsappMessageUtility.postResponse(message, responce.processed_message);
                    if (responce.message_from_dialoglow) {
                        let message_to_platform;
                        message_to_platform = await this.whatsappMessageUtility.SendWhatsappMediaMessage(message.sessionId, response_format.messageBody, response_format.messageText)
                        if (!responce.message_from_dialoglow) {
                            console.log('An error occurred while sending messages!');
                        }
                    }
                    else {
                        console.log('An error occurred while processing messages!');
                    }
                }
            }
            catch (error) {
                console.log("in error", error)
                this.errorHandler.handle_controller_error(error, res, req);
            }
        };
        
        receiveMessageOldNumber = async (req, res) => {
            console.log("receiveMessageold webhook")
            try {
                this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                if (req.body.statuses) {
                    // status = sent, received & read
                }
                else {
                    let whatsapp_id = req.body.contacts[0].wa_id;
        
                    let response_message = "We have migrated REAN Health Guru to a new number. Click this link to chat with REAN Health Guru. Link: https://api.whatsapp.com/send/?phone=15712152682&text=Hey&app_absent=0";
                    await this.whatsappMessageUtility.SendWhatsappMessageOldNumber(whatsapp_id, response_message);
        
                }
            }
            catch (error) {
                console.log("in error", error)
                this.errorHandler.handle_controller_error(error, res, req);
            }
        };

        // handleUserRequest = async (handlerequest) => {
        //     console.log("the req is RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR", req)
        //     let message_from_dialoglow: any;
        //     let processed_message: any;
        //     let translate_message: any;
        //     // this.WhatsappStatistics.saveRequestStatistics(req,message);

        //     //get the translated message
        //     translate_message = await this.translateService.translateMessage(message.messageBody)

        //     //send the translate_message to dialogflow and get response
        //     message_from_dialoglow = await this.dialogflowMessageUtility.getDialogflowMessage(translate_message.message, message.sessionId);
        //     // message_from_dialoglow = await this.dialogflowMessageUtility.getDialogflowMessage(message.messageBody, message.sessionId);

        //     // process the message from dialogflow before sending it to whatsapp
        //     processed_message = await this.translateService.processdialogflowmessage(message_from_dialoglow)

        //     return {processed_message, message_from_dialoglow}
        // };

}