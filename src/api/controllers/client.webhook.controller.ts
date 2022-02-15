import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container } from 'tsyringe';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';

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
            if (req.body.statuses) {

                // status = sent, received & read
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
