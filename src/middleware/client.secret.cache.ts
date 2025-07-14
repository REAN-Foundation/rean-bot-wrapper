import { AwsSecretsManager } from "../services/aws.secret.manager.service";
import { getRequestOptions } from '../utils/helper';
import needle from "needle";

export class ClientSecretCache {

    private static cache: Map<string, Record<string, any>> = new Map();

    private static initializedClients: Set<string> = new Set();

    private static loadingClients: Set<string> = new Set();

    // set a variable for a specific client
    static set<T = any>(clientName: string, key: string, value: T): void {
        const clientData = this.cache.get(clientName) || {};
        clientData[key] = value;
        this.cache.set(clientName, clientData);
    }

    // get a variable for a specific client
    static get(clientName: string, key: string) {

        // If client data has been loaded, return value
        const clientData = this.cache.get(clientName);
        if (clientData && key in clientData) {

            return clientData[key];
        }

        if (!this.initializedClients.has(clientName) && !this.loadingClients.has(clientName)) {
            this.loadingClients.add(clientName);

            // start loading the client variables
            setTimeout(async () => {
                if (clientName === undefined) {
                    console.log("Skipping the undefined client");
                } else {
                    await this.#loadClientData(clientName);
                    this.initializedClients.add(clientName);
                    this.loadingClients.delete(clientName);
                    console.log(`Secrets loaded for ${clientName}`);
                    console.log("THIS IS THE CACHE", this.cache);
                }
            });
        }

        return undefined;
    }

    // get all variables for a client
    static getAll(clientName: string): Record<string, any> | undefined {
        return this.cache.get(clientName);
    }

    static delete(clientName: string, key: string): void {
        const clientdata = this.cache.get(clientName);
        if (clientdata && key in clientdata) {
            delete clientdata[key];
            this.cache.set(clientName, clientdata);
        }
    }

    //clear entire client data
    static clearClient(clientName: string): void {
        this.cache.delete(clientName);
    }

    static async #loadClientData(clientName: string) {
        try {
            const options = getRequestOptions("rean_app");
            options.headers["authorization"] = `Bearer ${null}`;
            options.headers["x-api-key"] = process.env["REANCARE_API_KEY"];

            const apiUrl = `${process.env["REANCARE_BASE_URL"]}/tenant-settings/by-code/${clientName}`;
            const secretApiUrl = `${process.env["REANCARE_BASE_URL"]}/tenants/${clientName}/settings/secret`;
            let response = null;
            response = await needle("get", apiUrl, options);
            const secretResponse = await needle("get", secretApiUrl, options);

            if (response.statusCode === 200) {
                console.log('Tenant Settings retrieved successfully');
                const responseData = response.body.Data.TenantSettings.ChatBot;

                for (const [key, value] of Object.entries(responseData)) {
                    const envKey = this.toEnvStyle(key);
                    this.set(clientName, envKey, value);
                }
            } else {
                console.log("Failed to get response from Reancare API.");
            }
            if (secretResponse.statusCode === 200) {
                console.log("Secret Retrieved successfully");
                const secretResponseData = secretResponse.body.Data;

                for (const [key, value] of Object.entries(secretResponseData)) {
                    const envKey = this.toEnvStyle(key);
                    this.set(clientName, envKey, value);
                }

            }
        } catch (error) {
            console.log("Error while fetching the secret and tenant settings");
        }
    }

    private static toEnvStyle(key: string): string {
        return key

        // insert _ before a capital that follows a lowercase or digit
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            
        // insert _ between two capitals when the second is followed by lowercase
            .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
            .toUpperCase();
    }
}