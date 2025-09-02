import needle from "needle";
import { RequestResponseCacheService } from "../../modules/cache/request.response.cache.service";
import { ChatBotSettings, ConsentMessage, TenantSettingsDomainModel } from "../../domain.types/tenant.setting/tenant.setting.types";
import { ApiError } from "../../common/api.error";

///////////////////////////////////////////////////////////////////////////////

export class TenantSettingService {
    static async getTenantSettingByCode(tenantCode: string, apiKey: string, baseUrl: string): Promise<TenantSettingsDomainModel> {
        try {
            const cachedTenantSetting = await RequestResponseCacheService.get(`tenant-setting-${tenantCode}`);
            if (cachedTenantSetting) {
                return cachedTenantSetting;
            }
            const url = `${baseUrl}tenant-settings/by-code/${tenantCode}`;
            const response = await needle("get", url, {
                headers: {
                    'x-api-key': apiKey
                }
            });
            if (response.statusCode !== 200) {
                console.log(`ResponseCode: ${response.statusCode}, Body: ${JSON.stringify(response.body.error)}`);
                throw new ApiError(500, 'Error while getting tenant setting for tenant code: ' + tenantCode + ' ' + response.body.error.message);
            }
            const tenantSetting: TenantSettingsDomainModel = {
            Common : response.body?.Data?.TenantSettings?.Common,
            Followup : response.body?.Data?.TenantSettings?.Followup,
            ChatBot : response.body?.Data?.TenantSettings?.ChatBot,
            Forms : response.body?.Data?.TenantSettings?.Forms,
            Consent : response.body?.Data?.TenantSettings?.Consent,
            };
            await RequestResponseCacheService.set(`tenant-setting-${tenantCode}`, tenantSetting);
            return tenantSetting;
        } catch (error) {
            console.error('Error in TenantSettingService.getTenantSettingByCode:', error);
            return null;
        }
        
    }

    static async isConsentEnabled(tenantCode: string, apiKey: string, baseUrl: string): Promise<boolean> {
        try {
            const tenantSetting: TenantSettingsDomainModel = await this.getTenantSettingByCode(tenantCode, apiKey, baseUrl);
            return tenantSetting?.ChatBot?.Consent ?? false;
        } catch (error) {
            console.error('Error in TenantSettingService.isTenantSettingEnabled:', error);
            return false;
        }
    }

    static async getConsentMessages(tenantCode: string, apiKey: string, baseUrl: string, languageCode: string = 'en'): Promise<ConsentMessage> {
        const defaultConsentMessage = {
            LanguageCode: 'en',
            Content: 'Please read and accept the consent before using the service.',
            WebsiteURL: 'https://www.example.com'
        };
        try {
            const tenantSetting: TenantSettingsDomainModel = await this.getTenantSettingByCode(tenantCode, apiKey, baseUrl);
            return tenantSetting?.Consent?.Messages?.find(message => message.LanguageCode === languageCode) ?? defaultConsentMessage;
        } catch (error) {
            console.error('Error in TenantSettingService.getConsentMessages:', error);
            return defaultConsentMessage;
        }
    }

    static async getChatBotSettings(tenantCode: string, apiKey: string, baseUrl: string): Promise<ChatBotSettings> {
        try {
            const tenantSetting: TenantSettingsDomainModel = await this.getTenantSettingByCode(tenantCode, apiKey, baseUrl);
            return tenantSetting?.ChatBot ?? null;
        } catch (error) {
            console.error('Error in TenantSettingService.getChatBotSettings:', error);
            return null;
        }
    }
}
