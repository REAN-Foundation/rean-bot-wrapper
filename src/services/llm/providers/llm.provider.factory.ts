import { inject, Lifecycle, scoped } from "tsyringe";
import { ILLMProvider, LLMProviderConfig as ProviderConfig } from './llm.provider.interface';
import { OpenAIProvider } from './openai.provider';
import { LLMProviderConfigRepo } from '../../../database/repositories/llm/llm.provider.config.repo';
import { ILLMProviderConfig } from '../../../refactor/interface/llm/llm.interfaces';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import { ContainerService } from '../../container/container.service';

/**
 * Factory for creating LLM providers
 */
@scoped(Lifecycle.ContainerScoped)
export class LLMProviderFactory {

    // Cache for provider instances
    private providerCache: Map<string, ILLMProvider> = new Map();

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider
    ) {}

    /**
     * Get an LLM provider by name and model
     * @param providerName - Name of the provider (e.g., 'openai', 'claude')
     * @param modelName - Name of the model (e.g., 'gpt-3.5-turbo')
     * @returns Promise<ILLMProvider>
     */
    async getProvider(providerName: string, modelName: string): Promise<ILLMProvider> {
        const cacheKey = `${providerName}:${modelName}`;

        // Check cache first
        if (this.providerCache.has(cacheKey)) {
            return this.providerCache.get(cacheKey)!;
        }

        // Fetch configuration from database
        const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
        const container = ContainerService.createChildContainer(clientName);
        const config = await LLMProviderConfigRepo.findByProviderAndModel(
            container,
            providerName,
            modelName
        );

        if (!config) {
            throw new Error(`LLM provider configuration not found for ${providerName}/${modelName}`);
        }

        if (!config.enabled) {
            throw new Error(`LLM provider ${providerName}/${modelName} is disabled`);
        }

        // Create provider instance
        const provider = await this.createProvider(config);

        // Cache the provider
        this.providerCache.set(cacheKey, provider);

        return provider;
    }

    /**
     * Get the default enabled provider (highest priority)
     * @returns Promise<ILLMProvider>
     */
    async getDefaultProvider(): Promise<ILLMProvider> {
        const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
        const container = ContainerService.createChildContainer(clientName);
        const enabledProviders = await LLMProviderConfigRepo.findEnabledProviders(container);

        if (enabledProviders.length === 0) {
            throw new Error('No enabled LLM providers found');
        }

        // Get the highest priority (lowest priority number)
        const defaultConfig = enabledProviders[0];

        return this.getProvider(defaultConfig.providerName, defaultConfig.modelName);
    }

    /**
     * Get all enabled providers
     * @returns Promise<ILLMProvider[]>
     */
    async getAllEnabledProviders(): Promise<ILLMProvider[]> {
        const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
        const container = ContainerService.createChildContainer(clientName);
        const enabledConfigs = await LLMProviderConfigRepo.findEnabledProviders(container);

        const providers = await Promise.all(
            enabledConfigs.map(config =>
                this.getProvider(config.providerName, config.modelName)
            )
        );

        return providers;
    }

    /**
     * Create a provider instance from configuration
     * @param config - LLM provider configuration
     * @returns Promise<ILLMProvider>
     */
    private async createProvider(config: ILLMProviderConfig): Promise<ILLMProvider> {
        // Get API key from environment variable
        const apiKey = process.env[config.apiConfig.apiKeyEnvVar || ''];
        if (!apiKey) {
            throw new Error(
                `API key not found in environment variable: ${config.apiConfig.apiKeyEnvVar}`
            );
        }

        const providerConfig: ProviderConfig = {
            apiKey,
            baseUrl: config.apiConfig.baseUrl,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            timeoutMs: config.timeoutMs,
        };

        switch (config.providerName.toLowerCase()) {
            case 'openai':
                return new OpenAIProvider({
                    ...providerConfig,
                    model: config.modelName,
                });

            case 'claude':
                // TODO: Implement ClaudeProvider when needed
                throw new Error('Claude provider not yet implemented');

            default:
                throw new Error(`Unsupported LLM provider: ${config.providerName}`);
        }
    }

    /**
     * Clear the provider cache
     * Useful when provider configurations are updated
     */
    clearCache(): void {
        this.providerCache.clear();
    }

    /**
     * Health check all enabled providers
     * @returns Promise<Map<string, boolean>>
     */
    async healthCheckAll(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();
        const providers = await this.getAllEnabledProviders();

        for (const provider of providers) {
            const key = `${provider.providerName}:${provider.modelName}`;
            try {
                const isHealthy = await provider.healthCheck();
                results.set(key, isHealthy);
            } catch (error) {
                console.error(`Health check failed for ${key}:`, error);
                results.set(key, false);
            }
        }

        return results;
    }
}
