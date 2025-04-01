/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '../../common/logger';
import { ResponseHandler } from '../../utils/response.handler';
import { autoInjectable, delay, inject, Lifecycle, scoped } from 'tsyringe';
import { IntentEmitter } from '../../intentEmitters/intent.emitter';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../../services/common.response.format.object';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { TelegramMessageService } from '../../services/telegram.message.service';
import WorkflowUserData from '../../models/workflow.user.data.model';
import { QuestionResponseType, WorkflowEvent } from '../../services/emergency/workflow.event.types';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ChatSession } from '../../models/chat.session';
import { sendApiButtonService, templateButtonService, whatsappSingleMetaButtonService } from '../../services/whatsappmeta.button.service';
import { sendTelegramButtonService } from '../../services/telegram.button.service';
import { ChatMessage } from '../../models/chat.message.model';
import { WhatsappMetaMessageService } from '../../services/whatsapp.meta.message.service';

///////////////////////////////////////////////////////////////////////////////////

@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class ChatBotController {

    logger: Logger;

    private _platformMessageService :  platformServiceInterface ;

    constructor(@inject(delay(() => WhatsappMetaMessageService)) public whatsappNewMessageService?: WhatsappMetaMessageService,
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
        let messageChannel = requestBody.UserMessage.MessageChannel;
        if (requestBody.UserMessage.MessageChannel === "WhatsApp" || requestBody.UserMessage.MessageChannel === "Other"){
            messageChannel = "whatsappMeta";
        }
        else {
            messageChannel = "telegram";
        }

        this._platformMessageService = await request.container.resolve(messageChannel);
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
            ChannelMessageId  : messageChannel, //To be updated later
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
            SchemaName           : event.UserMessage.Payload.SchemaName ?? null,
            NodeInstanceId       : event.UserMessage.Payload.NodeInstanceId ?? null,
            NodeId               : event.UserMessage.Payload.NodeId ?? null,
            NodeActionId         : event.UserMessage.Payload.ActionId ?? null,
            Question             : event.UserMessage.QuestionText ?? null,
            QuestionOptions      : event.UserMessage.QuestionOptions ?? null,
            QuestionResponse     : event.UserMessage.QuestionResponse ?? null,
            QuestionResponseType : event.UserMessage.QuestionResponseType as QuestionResponseType,
            Placeholders         : event.UserMessage.Placeholders ?? null,
            Payload              : event.UserMessage.Payload ?? null,
        };

        const entManager = await this._entityProvider.getEntityManager(this.environmentProviderService);
        const workflowRepository = entManager.getRepository(WorkflowUserData);
        console.log("Storing the workflow event to database", workflowEventEntiry);
        const workflowEventEntityRecord = await workflowRepository.create(workflowEventEntiry);

        response_format.platformId = event.UserMessage.Phone;
        response_format.platform = event.UserMessage.MessageChannel === "Telegram" ||
            event.UserMessage.MessageChannel === "telegram" ?
            "telegram" : "whatsappMeta";

        response_format.sessionId = event.UserMessage.Phone;

        let payload = {};

        if (event.UserMessage.MessageType === "Text") {
            response_format.messageText = event.UserMessage.TextMessage;
            response_format.message_type = "text";
        }

        // First template to CFR
        else if (event?.UserMessage?.Payload?.MessageTemplateId?.startsWith("An emergency incident") && event.UserMessage.MessageType === "Location" &&
         event.UserMessage.MessageChannel === 'WhatsApp') {
            response_format.message_type  = 'template';
            console.log("An emergency incident message");

            // payload = await whatsappSingleMetaButtonService("OK", "Okay");
            payload["templateName"] = "alert_message";
            payload["languageForSession"] = "en";
            payload["text"] = event.UserMessage.TextMessage;
            payload["location"] = {
                name      : "Incident Location",
                latitude  : event.UserMessage?.Location?.Latitude,
                longitude : event.UserMessage?.Location?.Longitude

            };
            payload["variables"] = [
                {
                    type : "text",
                    text : event.UserMessage.TextMessage
                },
            ];
        }

        else if (event.UserMessage.MessageType === "Location") {
            response_format.location = {
                latitude  : event.UserMessage?.Location?.Latitude,
                longitude : event.UserMessage?.Location?.Longitude
            };
            response_format.message_type = "location";
        }

        // Second template to CFR
        else if (
            event.UserMessage.MessageType === "Question"  && event.UserMessage.QuestionText.startsWith("Will you be available")) {
            const options = event.UserMessage.QuestionOptions;
            const availabliltyButton = [];
            let i = 0;
            for (const option of options){
                const buttonId = option.Sequence;
                availabliltyButton.push(option.Text, buttonId);
                i = i + 1;
            }
            if (event.UserMessage.MessageChannel === 'WhatsApp' ||
                event.UserMessage.MessageChannel === 'whatsappWati') {
                payload = await sendApiButtonService(availabliltyButton);
                response_format.message_type  = 'template';
                payload["templateName"] = "availability_check";
                payload["languageForSession"] = "en";
            } else {
                payload = await sendTelegramButtonService(availabliltyButton);
                response_format.message_type = 'inline_keyboard';
            }
        }
        
        else if (event.UserMessage.MessageType === "Question" && !event.UserMessage.QuestionText.startsWith("Will you be available")) {
            response_format.message_type = "question";
            response_format.messageText = event.UserMessage.QuestionText;
            response_format.buttonMetaData = event.UserMessage.QuestionOptions;
            const options = event.UserMessage.QuestionOptions;
            const buttonArray = [];
            let messageType = 'text';
            if (workflowEventEntiry.QuestionResponseType === QuestionResponseType.SingleChoiceSelection) {
                let i = 0;
                for (const option of options){
                    const buttonId = option.Sequence;
                    buttonArray.push(option.Text, buttonId);
                    i = i + 1;
                }
                if (event.UserMessage.MessageChannel === 'WhatsApp' ||
                    event.UserMessage.MessageChannel === 'whatsappWati') {
                    payload = await sendApiButtonService(buttonArray);

                    // messageType = 'interactivebuttons';
                    // response_format.message_type = messageType;
                } else {
                    payload = await sendTelegramButtonService(buttonArray);
                    messageType = 'inline_keyboard';
                    response_format.message_type = messageType;
                }
            }
        }
       
        console.log("PAYLOAD", JSON.stringify(payload, null, 2));
        const res = await this._platformMessageService.SendMediaMessage(response_format, payload);
        if (res) {
            const channelMessageId = await this._platformMessageService.getMessageIdFromResponse(res);

            const chatMessageObj = {
                chatSessionID  : null,
                platform       : response_format.platform,
                direction      : "Out",
                messageType    : response_format.message_type,
                messageContent : response_format.messageText,
                userPlatformID : response_format.sessionId,
                intent         : "workflow",
                messageId      : channelMessageId,
            };
            const chatMessageRepository = await entManager.getRepository(ChatMessage);
            const msgRecord = await chatMessageRepository.create(chatMessageObj);
            const botMessageId = msgRecord.id;

            const eventRecordId = workflowEventEntityRecord ? workflowEventEntityRecord.id : null;
            if (eventRecordId) {
                await workflowRepository.update({
                    BotMessageId     : botMessageId,
                    ChannelMessageId : channelMessageId
                },
                {
                    where : { id: eventRecordId }
                });
            }
        }
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
        return chatSession.autoIncrementalID;
    };

}
