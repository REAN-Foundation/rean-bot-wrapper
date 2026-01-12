import { Iresponse } from "../../../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "../../../services/common.response.format.object";
import { MessageType } from "../../../domain.types/common.types";

export const FlowListener = async (intent: string, eventObj: any) => {
    try {
        console.log('Handling inent:', intent);
        const payload = eventObj.body?.originalDetectIntentRequest?.payload;
        if (!payload) {
            throw new Error('Invalid event object structure');
        }

        const source = payload?.source || 'whatsappMeta';
        const userId = payload?.userId;

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Resolve WhatsApp Meta service
        const platformMessageService = eventObj.container.resolve(source);

        if (!platformMessageService) {
            throw new Error(`Platform service not found for source: ${source}`);
        }

        const response_format: Iresponse = commonResponseMessageFormat();

        response_format.message_type = MessageType.FLOW;
        response_format.sessionId = userId;

        //Remember - flow name should be same as intent
        const flowName = payload?.completeMessage?.intent;

        payload['flowName'] = flowName;
        console.log(`WhatsApp Form Name: ${flowName}`);

        //TODO: Can set custom flow action payload data here
        payload['flowActionPayloadData'] = null;
        
        platformMessageService.SendMediaMessage(response_format, payload);

    } catch (error) {
        console.log('FlowListener error:', error?.message || error);
        throw error;
    }
};

export const ProcessWhatsAppFormResponsesListener = async (intent: string) => {
    try {

        // TODO: Implement the logic to process the WhatsApp form responses
        console.log('ProcessWhatsAppFormResponsesListener');
        console.log('Handling inent:', intent);
    } catch (error) {
        console.log('ProcessWhatsAppFormResponsesListener error:', error?.message || error);
        throw error;
    }
};
