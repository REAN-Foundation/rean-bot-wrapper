import { AwsSecretsManager } from "../../modules/secrets/providers/aws.secret.manager.service";
import { TenantSettingService } from "../tenant.setting/tenant.setting.service";
import { RequestResponseCacheService } from "../../modules/cache/request.response.cache.service";
import { inject } from 'tsyringe';

export class TenantSecretsService {

    private _awsSecretsManager: AwsSecretsManager = null;

    constructor() {
        this._awsSecretsManager = new AwsSecretsManager();
    }

     loadClientEnvVariables = async() => {

         try {
             const secretNameList = process.env.SECRET_NAME_LIST.split(',');
             const clientsList = [];
             for (const secretName of secretNameList) {
                 const secretObject = await this._awsSecretsManager.getSecrets(secretName);
                 const clientname = await this.storeVariablesInCache(secretObject, secretName);
                 clientsList.push(clientname);
             }
             return clientsList;

         } catch (e) {
             console.log(e);
         }
     }

     async storeVariablesInCache(secretObject, secretName) {
         try {

             if (!secretObject.NAME) {
                 const parts = secretName.split("-");

                 // Always skip the first and last
                 const tenantParts = parts.slice(1, -1);

                 // Join back with "-" and uppercase
                 const derivedTenantName = tenantParts.join("-").toUpperCase();

                 const tenantSecrets = {};
                 for (const k in secretObject) {
                     if (typeof secretObject[k] === "object"){
                         tenantSecrets[k.toUpperCase()] = JSON.stringify(secretObject[k]);
                     }
                     else {
                         tenantSecrets[k.toUpperCase()] = secretObject[k];
                     }
                     console.log("loading this key", `${derivedTenantName}_${k.toUpperCase()}`);
                 }

                 const apiKey = process.env["REANCARE_API_KEY"];
                 const baseUrl = process.env["REAN_APP_BACKEND_BASE_URL"];

                 if (apiKey && baseUrl) {
                     const tenantSettings = await TenantSettingService.getTenantSettingByCode(derivedTenantName, apiKey, baseUrl);
                     if (tenantSettings) {
                         const botSettings = tenantSettings.ChatBot;
                         for (const key in botSettings){
                             if (typeof tenantSettings.ChatBot[key] === "object"){
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
                 await RequestResponseCacheService.set(`bot-secrets-${derivedTenantName}`,
                     tenantSecrets,
                     "config"
                 );
                 return derivedTenantName;
             }
             else {
                 const tenantname = secretObject.NAME;
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
                 return tenantname;
             }
         } catch (e) {
             console.log(e);
         }
     }
}