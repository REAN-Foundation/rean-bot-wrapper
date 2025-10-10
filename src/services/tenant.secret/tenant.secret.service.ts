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
        @inject('ISecretsService') private _secretsManager: ISecretsService
    ) {}

    apiKey = process.env["REANCARE_API_KEY"];

    baseUrl = process.env["REAN_APP_BACKEND_BASE_URL"];


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
                clientsList.push(tenantCode);
                const secretName = await this.getSecretName(tenantCode);
                let secretObject = null;
                secretObject = await this._secretsManager.getSecrets(secretName);

                //  if (!secretObject) {
                //      const oldSecretName = this.getOldSecretName(tenantCode);
                //      console.log(`No secret found for ${secretName}. Trying old secret name ${oldSecretName}`);
                //      secretObject = await this._secretsManager.getSecrets(oldSecretName);
                //      if (!secretObject) {
                //          console.warn(`No secret found for tenant ${tenantCode} with names ${secretName} or ${oldSecretName}. Skipping...`);
                //          continue;
                //      }
                //  }
                if (!secretObject) {
                    console.warn(`No secret found for tenant ${tenantCode} with name ${secretName}. Skipping...`);
                    continue;
                }
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

            if (!secretObject.NAME) {

                //  const parts = secretName.split("-");

                //  // Always skip the first and last
                //  const tenantParts = parts.slice(1, -1);

                //  // Join back with "-" and uppercase
                //  const derivedTenantName = tenantParts.join("-").toUpperCase();

                const tenantSecrets = {};
                for (const k in secretObject) {
                    if (typeof secretObject[k] === "object"){
                        tenantSecrets[k.toUpperCase()] = JSON.stringify(secretObject[k]);
                    }
                    else {
                        tenantSecrets[k.toUpperCase()] = secretObject[k];
                    }
                    console.log("loading this key", `${tenantCode}_${k.toUpperCase()}`);
                }

                if (this.apiKey && this.baseUrl) {
                    const botSettings = await TenantSettingService.getChatBotSettings(
                        tenantCode,
                        this.apiKey,
                        this.baseUrl);

                    if (botSettings) {
                        for (const key in botSettings){
                            if (typeof botSettings[key] === "object"){
                                tenantSecrets[key.toUpperCase()] = JSON.stringify(botSettings[key]);
                            }
                            else {
                                tenantSecrets[key.toUpperCase()] = botSettings[key];
                            }
                        }
                    }
                } else {
                    console.warn(`Missing REANCARE_API_KEY or REAN_APP_BACKEND_BASE_URL. Skipping tenant settings fetch.`);
                }
                await RequestResponseCacheService.set(`bot-secrets-${tenantCode}`,
                    tenantSecrets,
                    "config"
                );
                return;
            }
            else {
                const tenantSecrets = {};
                for (const k in secretObject) {
                    if (typeof secretObject[k] === "object"){
                        tenantSecrets[k.toUpperCase()] = JSON.stringify(secretObject[k]);
                    }
                    else {
                        tenantSecrets[k.toUpperCase()] = secretObject[k];
                    }
                    console.log("loading this key", `${secretObject.NAME}_${k.toUpperCase()}`);
                }
                await RequestResponseCacheService.set(`bot-secrets-${secretObject.NAME}`,
                    tenantSecrets,
                    "config"
                );
                return;
            }
        } catch (e) {
            console.log(e);
        }
    }

    private getEnvironment = async () => {
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

    private getSecretName = async (tenantCode: string) => {
        const environment = await this.getEnvironment();
        const code = tenantCode.toLowerCase().replace(/_/g, "-");
        return `${environment}-${code}-v1`;
    };

    private getOldSecretName = async (tenantCode: string) => {
        const environment = await this.getEnvironment();
        const code = tenantCode.toLowerCase().replace(/_/g, "-");
        return `duploservices-${environment}-${code}-v1`;
    };
}