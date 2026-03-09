import { Logger } from '../../common/logger';
import { TenantSettingService } from '../../services/tenant.setting/tenant.setting.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';

export const DefaultWelcomeListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Default Welcome Instance!!!!!');
        
        let response = null;
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
        const tenantSettingService = eventObj.container.resolve(TenantSettingService);
        const clientName = await clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        const baseUrl = await clientEnvironmentProviderService.getClientEnvironmentVariable("REACT_APP_BASE_URL");
        const apiKey = await clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY");
        response = await TenantSettingService.getWelcomeMessage(clientName, apiKey, baseUrl);

        if (!response) {
            console.log('I am failed');
            throw new Error('Default welcome service failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Default welcome Listener Error!');
        throw new Error("Default welcome listener error");
    }
};
