import { Logger } from '../../common/logger';
import { TenantSettingService } from '../../services/tenant.setting/tenant.setting.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../../services/common.response.format.object';

export const DefaultWelcomeListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Default Welcome Instance!!!!!');
        
        let response = null;
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
        const clientName = await clientEnvironmentProviderService.getClientEnvironmentVariable("Name");
        const baseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
        const apiKey = process.env.REANCARE_API_KEY;
        response = await TenantSettingService.getWelcomeMessage(clientName, apiKey, baseUrl);
        if (!response) {
            console.log('I have failed');
            throw new Error('Default welcome service failed');
        }
        const welcomeContent = response.Content || '';
        let finalMessage = welcomeContent;

        if (response.URL) {
            finalMessage = `${welcomeContent}\n\n${response.URL}`;
        }

        const platformMessageService = eventObj.container.resolve(payload.source);
        platformMessageService.res = eventObj.res;
        const response_format: Iresponse = commonResponseMessageFormat();

        response_format.sessionId = payload.userId;
        response_format.messageText = finalMessage;
        response_format.message_type = "text";

        await platformMessageService.SendMediaMessage(response_format, null);

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Default welcome Listener Error!');
        throw new Error("Default welcome listener error");
    }
};
