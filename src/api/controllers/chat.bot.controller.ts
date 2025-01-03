import { Logger } from '../../common/logger';
import { ResponseHandler } from '../../utils/response.handler';
import { autoInjectable, inject, Lifecycle, scoped } from 'tsyringe';
import { IntentEmitter } from '../../intentEmitters/intent.emitter';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../../services/common.response.format.object';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { TelegramMessageService } from '../../services/telegram.message.service';
@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class ChatBotController {

    logger: Logger;
    private _platformMessageService :  platformServiceInterface ;

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
       @inject(TelegramMessageService) private telegramMessageService?:TelegramMessageService,
        private responseHandler?: ResponseHandler) {
        
        this.logger = Logger.instance();
       
    }

    ping = async (request, response) => {
        return this.responseHandler.sendSuccessResponse(response, 200, 'pong', { 'pong': true }, true);
    };

    validateIntent = async (request, response) => {
        const intent = request.query.intent_name;
        this.logger.log("Checking Event Emitter details for Intent Name: " + intent);

        if (!intent || intent.trim() === '') {
            return this.responseHandler.sendFailureResponse(response, 400, 'Missing required parameter [intent].', request);
        }

        const intent_listeners = {
            total_listeners : IntentEmitter.getIntentListenerCount(intent)
        };

        return this.responseHandler.sendSuccessResponse(response, 200, 'Intent Listeners Info', intent_listeners, true);
    };

    // Intent Fulfillment API
    processIntent = async (request, response) => {

        // Emit the event for given intent
        const intent = request.body.queryResult ? request.body.queryResult.intent.displayName : null;

        if (!intent || intent.trim() === '') {
            return this.responseHandler.sendFailureResponse(response, 400, 'Missing required parameter [intent].', request);
        }

        const total_listeners = IntentEmitter.getIntentListenerCount(intent);
        let fulfillmentResponse = null;

        this.logger.log(`Emitting Intent:: ${intent}, Total Listeners:: ${total_listeners}`);

        // No listeners registered. Invoke fallback mechanism.
        if (total_listeners === 0) {
            this.logger.log("No listeners registered for this Intent. Calling fallback mechanism to notify.");
            fulfillmentResponse = 'Opps! Intent cannot be fulfilled. Please try again after some time.';

            // notify fallback/failure channel(s)
            request.body.failureReason = 'No listeners registered for this Intent.';
            IntentEmitter.emit('IntentFulfillment:Failure', request.body);
            return this.responseHandler.sendFailureResponse(response, 500, 'Intent not fulfilled.', request);
        }

        // Emit the Intent Processing
        fulfillmentResponse = await IntentEmitter.emit(intent, request);

        // Either overall fulfillment rejected or all of the listeners rejected to fulfill
        const someListenerFulfilled = fulfillmentResponse.some((listenerResponse) => {
            return listenerResponse.status === 'fulfilled'; });
        if (!someListenerFulfilled) {
            request.body.failureReason = fulfillmentResponse;
            IntentEmitter.emit('IntentFulfillment:Failure', request.body);
            return this.responseHandler.sendFailureResponse(response, 500, 'Failed to Process intent.', request);
        }

        this.logger.log(`One or more listeners have fulfilled the Intent successfully.`);
        IntentEmitter.emit('IntentFulfillment:Success', intent);

        return this.responseHandler.sendSuccessResponse(response, 200, 'Intent fulfilled successfully.', fulfillmentResponse);
    };

    sendWorkflowMessage = async (request, response) => {
        const request_body = request.body;
        console.log(request_body);
        this._platformMessageService = await request.container.resolve("telegram");
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = "telegram";
        response_format.sessionId = request_body.Phone;
        response_format.messageText = request_body.TextMessage;
        response_format.message_type = "text";
        const result = await this.telegramMessageService.SendMediaMessage(response_format, null);
        return this.responseHandler.sendSuccessResponse(response, 200, 'ok', { 'Data': request_body }, true);
    };

}

