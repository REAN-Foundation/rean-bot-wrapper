import 'reflect-metadata';
import { ConfigurationManager } from '../../configs/configuration.manager';
import { DependencyContainer } from 'tsyringe';
import { AwsSecretsManager } from './providers/aws.secret.manager.service';
import { AzureStorageFileStorageService } from './providers/azure.storage.file.storage.service';

////////////////////////////////////////////////////////////////////////////////

export class SecretsManagerInjector {

    static registerInjections(container: DependencyContainer) {

        const provider = ConfigurationManager.SecretsProvider();
        if (provider === 'AWS-Secrets-Manager') {
            container.register('ISecretsService', AwsSecretsManager);
        }
        else if (provider === 'Azure-Key-Vault') {
            container.register('ISecretsService', AzureStorageFileStorageService);
        }
    }

}
