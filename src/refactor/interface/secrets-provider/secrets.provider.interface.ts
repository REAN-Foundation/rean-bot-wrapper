export interface SecretsProvider {
    getSecrets(): Promise<any[]>;
}