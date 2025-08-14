import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretsProvider } from '../../refactor/interface/secrets-provider/secrets.provider.interface';

export class AzureSecretsProvider implements SecretsProvider {

    async getSecrets(): Promise<any[]> {

        const keyVaultName = process.env.AZURE_KEY_VAULT_NAME;
        const secretNameList = process.env.SECRET_NAME_LIST.split(",");
        const secretObjectList = [];

        const KVUri = `https://${keyVaultName}.vault.azure.net`;

        const credential = new DefaultAzureCredential();

        const client = new SecretClient(KVUri, credential);

        for (const secretName of secretNameList ) {
            try {
                const retrievedSecret = await client.getSecret(secretName);
                const parsedSecret = JSON.parse(retrievedSecret.value);
                secretObjectList.push(parsedSecret);
            } catch (err) {
                console.error(`Error retrieving secret '${secretName}':`, err.message);
            }
        }

        return secretObjectList;
    }
}