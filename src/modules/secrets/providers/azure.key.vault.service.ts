// import { SecretClient } from "@azure/keyvault-secrets";
// import { DefaultAzureCredential } from "@azure/identity";
// import { ISecretsService } from '../interfaces/secrets.provider.interface';

// export class AzureSecretsProvider implements ISecretsService {

//     async getSecrets(secretName): Promise<any[]> {

//         const keyVaultName = process.env.AZURE_KEY_VAULT_NAME;

//         const KVUri = `https://${keyVaultName}.vault.azure.net`;

//         const credential = new DefaultAzureCredential();

//         const client = new SecretClient(KVUri, credential);

//         try {
//             const retrievedSecret = await client.getSecret(secretName);
//             const parsedSecret = JSON.parse(retrievedSecret.value);
//             return parsedSecret;
//         } catch (err) {
//             console.error(`Error retrieving secret '${secretName}':`, err.message);
//         }

//     }
// }