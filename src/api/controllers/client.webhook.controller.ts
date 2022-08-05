/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container } from 'tsyringe';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';
import util from 'util';

@autoInjectable()
export class ClientWebhookController {

    private _platformMessageService?: platformServiceInterface;
    
    private _clientAuthenticatorService?: clientAuthenticator;

    constructor(
        private responseHandler?: ResponseHandler,
        private errorHandler?: ErrorHandler) {

    }

    sendMessage = async (req, res) => {
        console.log("sendMessage webhook");
        try {
            // eslint-disable-next-line max-len
            this._platformMessageService = container.resolve(req.params.channel);
            const responce = await this._platformMessageService.sendManualMesage(req.body);
            if (responce) this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', responce);
            else
                this.responseHandler.sendFailureResponse(res, 200, 'An error occurred while sending messages!', req);
        }
        catch (error) {
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    receiveMessage = async (req, res) => {
        console.log("receiveMessage webhook");
        try {
            this._clientAuthenticatorService = container.resolve(req.params.channel + '.authenticator');
            this._clientAuthenticatorService.authenticate(req,res);
            const status = req.body.statuses;
            if (status) {
                if (status[0].status === "sent") {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message is sent successfully!', "");
                }
                else if (status[0].status === "delivered") {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message is delivered successfully!', "");
                }
                else if (status[0].status === "read") {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message is read successfully!', "");
                }
                else {

                    //deal accordingly
                }
            }
            else {
                if (req.params.channel !== "REAN_SUPPORT" && req.params.channel !== "slack"){
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                this._platformMessageService = container.resolve(req.params.channel);
                this._platformMessageService.res = res;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const response = this._platformMessageService.handleMessage(req.body, req.params.channel);
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    authenticateMetaWhatsappWebhook = async (req, res) => {
        console.log("meta whatsapp webhook verification");
        try {
            const challange = req.query["hub.challenge"];
            this.responseHandler.sendSuccessResponseForWhatsappAPI(res,200,challange);
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }

    }

    receiveMessageMetaWhatsapp = async (req, res) => {
        // console.log("receiveMessage webhook receiveMessageWhatsappNew");
        try {
            this._clientAuthenticatorService = container.resolve(req.params.channel + '.authenticator');
            this._clientAuthenticatorService.authenticate(req,res);
            const statuses = req.body.entry[0].changes[0].value.statuses;
            if (statuses) {
                if (statuses[0].status === "sent") {

                    // console.log("sent", statuses);
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', "");
                }
                else if (statuses[0].status === "delivered") {

                    // console.log("delivered", statuses);
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message delivered successfully!', "");
                }
                else if (statuses[0].status === "read") {

                    // console.log("read", statuses);
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message read successfully!', "");
                }
                else {
                    //deal accordingly
                    // console.log("Check status", statuses[0].status);
                }
            }
            else {
                console.log("receiveMessage webhook receiveMessageWhatsappNew");
                if (req.params.channel !== "REAN_SUPPORT" && req.params.channel !== "slack"){
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                this._platformMessageService = container.resolve(req.params.channel);
                this._platformMessageService.res = res;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                // console.log("reqbody content", util.inspect(req.body));
                // console.log("changes content", util.inspect(req.body.entry[0].changes[0]));
                const response = this._platformMessageService.handleMessage(req.body.entry[0].changes[0].value, req.params.channel);
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    receiveMessageOldNumber = async (req, res) => {
        console.log("receiveMessageold webhook");
        try {
            this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
            if (req.body.statuses) {

                // status = sent, received & read
            }
            else {

                // eslint-disable-next-line max-len
                // const response_message = "We have migrated REAN Health Guru to a new number. Click this link to chat with REAN Health Guru. Link: https://api.whatsapp.com/send/?phone=15712152682&text=Hey&app_absent=0";
                this._platformMessageService = container.resolve('whatsapp');

                this._platformMessageService.handleMessage(req.body, req.params.client);
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

}
