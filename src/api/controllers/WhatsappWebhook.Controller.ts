import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/Error.Handler';
import { WhatsappMessageService } from '../../services/whatsapp-message.service';
import { Logger } from '../../common/logger';
import { DialogflowResponseService } from '../../services/dialogflow-response.service';
import { injectable } from 'tsyringe';
// const ConverSpeechToText = require('../services/SpeechToTextService');
// const { isArray } = require('util');


let logger = new Logger();
let WhatsappMessageUtility = new WhatsappMessageService();
let responsehandler = new ResponseHandler(logger);
let errorhandler = new ErrorHandler();


@injectable()
export class WhatsappWebhookController {

    constructor(private whatsappMessageUtility?: WhatsappMessageService,
        private responseHandler?: ResponseHandler,
        private errorHandler?: ErrorHandler,
        private dialogflowMessageUtility?: DialogflowResponseService) {

        }
        sendMessage = async (req, res) => {
            try {
                let responce = await WhatsappMessageUtility.SendWhatsappMessage(req.body.contact, req.body.message);
                if (responce) responsehandler.sendSuccessResponse(res, 200, 'Message sent successfully!', responce);
                else
                    responsehandler.sendFailureResponse(res, 200, 'An error occurred while sending messages!', req);
            }
            catch (error) {
                errorhandler.handle_controller_error(error, res, req);
            }
        };
        
        receiveMessage = async (req, res) => {
            try {
                //to prevent whatsapp from sending duplicate calls, respond emidiately
                responsehandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                if (req.body.statuses) {
                    // status = sent, received & read
                }
                else {
                    let responce = await WhatsappMessageUtility.handleUserRequest(req);
                }
            }
            catch (error) {
                console.log("in error", error)
                errorhandler.handle_controller_error(error, res, req);
            }
        };
        
        receiveMessageOldNumber = async (req, res) => {
            try {
                responsehandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                if (req.body.statuses) {
                    // status = sent, received & read
                }
                else {
                    let whatsapp_id = req.body.contacts[0].wa_id;
        
                    let response_message = "We have migrated REAN Health Guru to a new number. Click this link to chat with REAN Health Guru. Link: https://api.whatsapp.com/send/?phone=15712152682&text=Hey&app_absent=0";
                    await WhatsappMessageUtility.SendWhatsappMessageOldNumber(whatsapp_id, response_message);
        
                }
            }
            catch (error) {
                console.log("in error", error)
                errorhandler.handle_controller_error(error, res, req);
            }
        };

}