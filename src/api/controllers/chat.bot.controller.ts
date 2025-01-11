/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '../../common/logger';
import { ResponseHandler } from '../../utils/response.handler';
import { autoInjectable, inject, Lifecycle, scoped } from 'tsyringe';
import { IntentEmitter } from '../../intentEmitters/intent.emitter';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../../services/common.response.format.object';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { TelegramMessageService } from '../../services/telegram.message.service';
import WorkflowUserData from '../../models/workflow.user.data.model';
import { WorkflowEvent } from '../../services/emergency/workflow.event.types';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ChatSession } from '../../models/chat.session';

///////////////////////////////////////////////////////////////////////////////////

@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class ChatBotController {

    logger: Logger;

    private _platformMessageService :  platformServiceInterface ;

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private _entityProvider?: EntityManagerProvider,
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
        const requestBody = request.body;
        console.log(requestBody);

        this._platformMessageService = await request.container.resolve("telegram");
        const response_format: Iresponse = commonResponseMessageFormat();

        const event: WorkflowEvent = requestBody;

        const userPlatformId = event.UserMessage?.Phone ?? null;
        const chatSessionId = await this.getChatSessionId(userPlatformId);

        const workflowEventEntiry = {
            TenantId          : event.TenantId,
            EventType         : event.EventType,
            SchemaId          : event.SchemaId,
            SchemaInstanceId  : event.SchemaInstanceId,
            ChatSessionId     : chatSessionId,
            BotMessageId      : null, //To be updated later
            ChannelMessageId  : null, //To be updated later
            UserPlatformId    : userPlatformId,
            PhoneNumber       : event.UserMessage.Phone ?? null,
            ChannelType       : event.UserMessage.MessageChannel,
            MessageType       : event.UserMessage.MessageType,
            IsMessageFromUser : false,
            TextMessage       : event.UserMessage.TextMessage ?? null,
            Location          : event.UserMessage.Location ?? null,
            ImageUrl          : event.UserMessage.ImageUrl ?? null,
            AudioUrl          : event.UserMessage.AudioUrl ?? null,
            VideoUrl          : event.UserMessage.VideoUrl ?? null,
            FileUrl           : event.UserMessage.FileUrl ?? null,
            EventTimestamp    : event.UserMessage.EventTimestamp ?
                new Date(event.UserMessage.EventTimestamp) : new Date(),
            SchemaName       : event.UserMessage.Payload.SchemaName ?? null,
            NodeInstanceId   : event.UserMessage.Payload.NodeInstanceId ?? null,
            NodeId           : event.UserMessage.Payload.NodeId ?? null,
            NodeActionId     : event.UserMessage.Payload.ActionId ?? null,
            Question         : event.UserMessage.Question ?? null,
            QuestionOptions  : event.UserMessage.QuestionOptions ?? null,
            QuestionResponse : event.UserMessage.QuestionResponse ?? null,
            Placeholders     : event.UserMessage.Placeholders ?? null,
            Payload          : event.UserMessage.Payload ?? null,
        };

        const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
        const workflowRepository = entManager.getRepository(WorkflowUserData);
        console.log("Storing the workflow event to database", workflowEventEntiry);
        await workflowRepository.create(workflowEventEntiry);

        response_format.platform = "telegram";
        response_format.sessionId = requestBody.Phone;
        response_format.messageText = requestBody.TextMessage;
        response_format.message_type = "text";

        const result = await this.telegramMessageService.SendMediaMessage(response_format, null);

        //Please update the BotMessageId and ChannelMessageId in the database in table WorkflowUserData

        return this.responseHandler.sendSuccessResponse(response, 200, 'ok', { 'Data': requestBody }, true);
    };

    getChatSessionId = async (platformUserId: string) => {
        const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
        const chatSessionRepository = entManager.getRepository(ChatSession);
        const chatSession = await chatSessionRepository.findOne({
            where : {
                userPlatformID : platformUserId
            }
        });
        if (!chatSession) {
            return null;
        }
        return chatSession.id;
    };

}
