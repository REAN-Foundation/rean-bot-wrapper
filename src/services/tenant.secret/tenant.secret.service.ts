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
                for (const key in secretObject) {

                    // const secretKey = this.pascalToCapitalSnake(key);
                    if (typeof secretObject[key] === "object"){
                        tenantSecrets[key] = JSON.stringify(secretObject[key]);
                    }
                    else {
                        tenantSecrets[key] = secretObject[key];
                    }
                    console.log("loading this key", `${tenantCode}_${key}`);
                }

                if (this.apiKey && this.baseUrl) {
                    const botSettings = await TenantSettingService.getTenantSettingByCode(
                        tenantCode,
                        this.apiKey,
                        this.baseUrl);

                    if (botSettings) {
                        for (const key in botSettings.Common){

                            // const secretKey = this.pascalToCapitalSnake(key);
                            if (typeof botSettings.Common[key] === "object"){
                                tenantSecrets[key] = JSON.stringify(botSettings.Common[key]);
                            }
                            else {
                                tenantSecrets[key] = botSettings.Common[key];
                            }

                            console.log("loading this key", `${tenantCode}_${key}`);
                        }

                        for (const key in botSettings.ChatBot){

                            // const secretKey = this.pascalToCapitalSnake(key);
                            if (typeof botSettings.ChatBot[key] === "object"){
                                tenantSecrets[key] = JSON.stringify(botSettings.ChatBot[key]);
                            }
                            else {
                                tenantSecrets[key] = botSettings.ChatBot[key];
                            }

                            console.log("loading this key", `${tenantCode}_${key}`);
                        }

                        for (const key in botSettings.Custom){

                            // const secretKey = this.pascalToCapitalSnake(key);
                            if (typeof botSettings.Custom[key] === "object"){
                                tenantSecrets[key] = JSON.stringify(botSettings.Custom[key]);
                            }
                            else {
                                tenantSecrets[key] = botSettings.Custom[key];
                            }

                            console.log("loading this key", `${tenantCode}_${key}`);
                        }

                        for (const key in botSettings.Followup){

                            // const secretKey = this.pascalToCapitalSnake(key);
                            if (typeof botSettings.Followup[key] === "object"){
                                tenantSecrets[key] = JSON.stringify(botSettings.Followup[key]);
                            }
                            else {
                                tenantSecrets[key] = botSettings.Followup[key];
                            }

                            console.log("loading this key", `${tenantCode}_${key}`);
                        }

                        for (const key in botSettings.Forms){

                            // const secretKey = this.pascalToCapitalSnake(key);
                            if (typeof botSettings.Forms[key] === "object"){
                                tenantSecrets[key] = JSON.stringify(botSettings.Forms[key]);
                            }
                            else {
                                tenantSecrets[key] = botSettings.Forms[key];
                            }

                            console.log("loading this key", `${tenantCode}_${key}`);
                        }

                        for (const key in botSettings.Consent){

                            // const secretKey = this.pascalToCapitalSnake(key);
                            if (typeof botSettings.Consent[key] === "object"){
                                tenantSecrets[key] = JSON.stringify(botSettings.Consent[key]);
                            }
                            else {
                                tenantSecrets[key] = botSettings.Consent[key];
                            }

                            console.log("loading this key", `${tenantCode}_${key}`);
                        }
                    }

                } else {
                    console.warn(`Missing REANCARE_API_KEY or REAN_APP_BACKEND_BASE_URL. Skipping tenant settings fetch.`);
                }
                await RequestResponseCacheService.set(`bot-secrets-${tenantCode}`,
                    tenantSecrets,
                    "persistent"
                );
                return;
            }
            else {
                const tenantSecrets = {};
                for (const key in secretObject) {
                    if (typeof secretObject[key] === "object"){
                        tenantSecrets[key] = JSON.stringify(secretObject[key]);
                    }
                    else {
                        tenantSecrets[key] = secretObject[key];
                    }
                    console.log("loading this key", `${secretObject.NAME}_${key}`);
                }
                await RequestResponseCacheService.set(`bot-secrets-${secretObject.NAME}`,
                    tenantSecrets,
                    "persistent"
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

    private pascalToCapitalSnake(s: string): string {

        return s.replace(/([A-Z])/g, "_$1").replace(/^_/, "").toUpperCase();
    }

}
