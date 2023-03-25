/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { autoInjectable, container, scoped, Lifecycle, inject } from 'tsyringe';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import util from 'util';

@scoped(Lifecycle.ContainerScoped)
export class ClientWebhookController {

    private _clientAuthenticatorService?: clientAuthenticator;

    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        // @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {

    }

    sendMessage = async (req, res) => {
        console.log("sendMessage webhook");
        try {
            // eslint-disable-next-line max-len
            this._platformMessageService = req.container.resolve(req.params.channel);
            const response = await this._platformMessageService.sendManualMesage(req.body);
            if (response.statusCode === 200 || response.message_id !== undefined) {
                this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', response.body);
            }
            else {
                this.responseHandler.sendFailureResponse(res, 400, 'An error occurred while sending messages!', req);
            }
        }
        catch (error) {
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    receiveMessage = async (req, res) => {
        console.log("receiveMessage webhook");
        try {
            this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
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

                    console.log(util.inspect(status[0].status));
                    this.responseHandler.sendSuccessResponse(res, 200, 'Notification received',"");
                    
                    //deal accordingly
                }
            }
            else {
                if (req.params.channel !== "REAN_SUPPORT" &&
                    req.params.channel !== "slack" &&
                    req.params.channel !== "SNEHA_SUPPORT") {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                this._platformMessageService = req.container.resolve(req.params.channel);
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
            this.responseHandler.sendSuccessResponseForWhatsappAPI(res,200,req);
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }

    };

    receiveMessageMetaWhatsapp = async (req, res) => {
        // console.log("receiveMessage webhook receiveMessageWhatsappNew");
        try {

            // const clientEnvironmentProviderService2: ClientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            // console.log(this.clientEnvironmentProviderService.getClientName());
            // console.log(clientEnvironmentProviderService2.getClientName());
            // const phone_number_id = this.clientEnvironment.getClientEnvironmentVariable('WHATSAPP_PHONE_NUMBER_ID');
            // if (req.body.entry[0].changes[0].value.metadata.phone_number_id !== phone_number_id){
            //     this.responseHandler.sendSuccessResponse(res, 200, 'Cross Connection', "");
            //     console.log("Cross connection");
            // }
            // else {
            this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
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
                    this.responseHandler.sendSuccessResponse(res, 200, 'Notification received successfully!', "");

                //deal accordingly
                // console.log("Check status", statuses[0].status);
                }
            }
            else {
                console.log("receiveMessage webhook receiveMessageWhatsappNew");
                if (req.params.channel !== "REAN_SUPPORT" &&
                req.params.channel !== "slack" &&
                req.params.channel !== "SNEHA_SUPPORT") {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                this._platformMessageService = req.container.resolve(req.params.channel);
                this._platformMessageService.res = res;
                const response = this._platformMessageService.handleMessage(req.body.entry[0].changes[0].value, req.params.channel);
            }
            // }
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
                this._platformMessageService = req.container.resolve('whatsapp');

                this._platformMessageService.handleMessage(req.body, req.params.client);
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

}
