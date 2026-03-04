import { TenantSettingService } from "../tenant.setting/tenant.setting.service";
import { RequestResponseCacheService } from "../../modules/cache/request.response.cache.service";
import { inject, injectable } from 'tsyringe';
import { ISecretsService } from '../../modules/secrets/interfaces/secrets.provider.interface';
import { TenantService } from "../tenant/tenant.service";
import { ApiError } from "../../common/api.error";
import { Environment } from "../../domain.types/tenant.setting/tenant.setting.types";

@injectable()
export class TenantSecretsService {

    constructor(
        @inject('ISecretsService') private readonly _secretsManager: ISecretsService
    ) {}

    apiKey = process.env.REANCARE_API_KEY;

    baseUrl = process.env.REAN_APP_BACKEND_BASE_URL;


    public loadClientEnvVariables = async() => {
        try {
            const tenantObjectList = await TenantService.getAllTenants(this.apiKey, this.baseUrl);
            if (!tenantObjectList || tenantObjectList.length === 0) {
                console.warn("No tenants found to load secrets for.");
                return;
            }
            const clientsList = [];

            for (const tenant of tenantObjectList) {
                const tenantCode = tenant.Code;
                if (tenantCode === "default") {
                    continue;
                }
                const secretName = await this.getSecretName(tenantCode);
                let secretObject = null;
                secretObject = await this._secretsManager.getSecrets(secretName);
                if (!secretObject) {
                    console.warn(`No secret found for tenant ${tenantCode} with name ${secretName}. Skipping...`);
                    continue;
                }
                clientsList.push(tenantCode);
                await this.storeVariablesInCache(secretObject, tenantCode);
            }
            return clientsList;

        } catch (e) {
            console.log(e);
        }
    };

    // Private region

    private async storeVariablesInCache(secretObject, tenantCode) {
        try {

            // if (!secretObject.NAME) {

            let tenantSecrets = {...secretObject};
            if (this.apiKey && this.baseUrl) {
                const botSettings = await TenantSettingService.getTenantSettingByCode(
                    tenantCode,
                    this.apiKey,
                    this.baseUrl);

                if (botSettings) {
                    tenantSecrets = {...tenantSecrets, ...botSettings.Common, ...botSettings.ChatBot, ...botSettings.Custom, ...botSettings.Followup, ...botSettings.Forms};
                    console.log("Final tenant secrets:", tenantSecrets);
                }

            } else {
                console.warn(`Missing REANCARE_API_KEY or REAN_APP_BACKEND_BASE_URL. Skipping tenant settings fetch.`);
            }
            await RequestResponseCacheService.set(`bot-secrets-${tenantCode}`,
                tenantSecrets,
                "persistent"
            );
            const cachedData =await RequestResponseCacheService.get(`bot-secrets-${tenantCode}`);
            console.log("cached data is ", cachedData);

            return;

            // }
            // else {
            //     const tenantSecrets = {};
            //     for (const key in secretObject) {
            //         if (typeof secretObject[key] === "object"){
            //             tenantSecrets[key] = JSON.stringify(secretObject[key]);
            //         }
            //         else {
            //             tenantSecrets[key] = secretObject[key];
            //         }
            //         console.log("loading this key", `${secretObject.NAME}_${key}`);
            //     }
            //     await RequestResponseCacheService.set(`bot-secrets-${secretObject.NAME}`,
            //         tenantSecrets,
            //         "persistent"
            //     );
            //     return;
            // }
        } catch (e) {
            console.log(e);
        }
    }

    private readonly getEnvironment = async () => {
        const env = process.env.NODE_ENV;
        if (!env) {
            throw new ApiError(500, 'NODE_ENV is not set.');
        }

        switch (env) {
        case Environment.Development:
            return 'dev';
        case Environment.Production:
            return 'prod';
        case Environment.Uat:
            return 'uat';
        default:
            throw new ApiError(500, `Invalid NODE_ENV value: ${env}`);
        }
    };

    private readonly getSecretName = async (tenantCode: string) => {
        const environment = await this.getEnvironment();
        const code = tenantCode.toLowerCase().replace(/_/g, "-");
        return `${environment}-${code}-v1`;
    };

    private readonly getOldSecretName = async (tenantCode: string) => {
        const environment = await this.getEnvironment();
        const code = tenantCode.toLowerCase().replace(/_/g, "-");
        return `duploservices-${environment}-${code}-v1`;
    };

    private pascalToCapitalSnake(s: string): string {

        return s.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toUpperCase();
    }

}
