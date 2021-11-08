import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container } from 'tsyringe';

@autoInjectable()
export class ClientWebhookController {

    private _platformMessageService?: platformServiceInterface;

    constructor(
        private responseHandler?: ResponseHandler,
        private errorHandler?: ErrorHandler) {

    }
    
    sendMessage = async (req, res) => {
        console.log("sendMessage webhook");
        try {
            // eslint-disable-next-line max-len
            const responce = await this._platformMessageService.SendMediaMessage(req.body.contact, null, req.body.message);
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
            if (req.body.statuses) {
                // status = sent, received & read
            }
            else {
                if (req.params.client !== "REAN_SUPPORT"){
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                this._platformMessageService = container.resolve(req.params.client);
                this._platformMessageService.res = res;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                this._platformMessageService.handleMessage(req.body, req.params.client);
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

}
