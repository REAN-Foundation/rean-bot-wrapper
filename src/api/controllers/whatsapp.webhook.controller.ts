import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable } from 'tsyringe';

import {container} from "tsyringe";


@autoInjectable()
export class WhatsappWebhookController {
    private _platformMessageService?: platformServiceInterface;

    constructor(
        private responseHandler?: ResponseHandler,
        private errorHandler?: ErrorHandler) {

        }
        sendMessage = async (req, res) => {
            console.log("sendMessage webhook")
            try {
                let responce = await this._platformMessageService.SendMediaMessage(req.body.contact, null, req.body.message);
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

                if (req.body.statuses) {
                    // status = sent, received & read
                }
                else {
                    if (req.params.client!=="REAN_SUPPORT"){
                        this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                    }
                    this._platformMessageService = container.resolve(req.params.client);
                    this._platformMessageService.res = res;
                    const response = this._platformMessageService.handleMessage(req.body, req.params.client);
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
                    this._platformMessageService = container.resolve('whatsapp');
                    // await this._platformMessageService.SendWhatsappMessageOldNumber(whatsapp_id, response_message);
        
                }
            }
            catch (error) {
                console.log("in error", error)
                this.errorHandler.handle_controller_error(error, res, req);
            }
        };

}