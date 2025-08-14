import { SecretsProvider } from "../refactor/interface/secrets-provider/secrets.provider.interface";
import { AwsSecretsManager } from "../services/secrets.services/aws.secret.manager.service";
import { AzureSecretsProvider } from "../services/secrets.services/azure.key.vault.service";

export class SecretsProviderFactory {
    
    static createProvider(): SecretsProvider {
        const provider = process.env.SECRETS_PROVIDER?.toLowerCase();

        switch (provider) {
        case "aws":
            return new AwsSecretsManager();
        case "azure":
            return new AzureSecretsProvider();
        default:
            throw new Error(`Unsupported secrets provider: ${provider}`);
        }
    }
}