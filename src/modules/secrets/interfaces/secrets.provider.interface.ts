export interface ISecretsService {
    getSecrets(secretName): Promise<any[]>;
}