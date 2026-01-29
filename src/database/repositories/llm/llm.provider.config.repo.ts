import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { LLMProviderConfig } from "../../../models/llm/llm.provider.config.model";
import { ILLMProviderConfig } from "../../../refactor/interface/llm/llm.interfaces";

///////////////////////////////////////////////////////////////////////////////

export class LLMProviderConfigRepo {

    static findByProviderAndModel = async (
        container: DependencyContainer,
        providerName: string,
        modelName: string
    ): Promise<ILLMProviderConfig | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(LLMProviderConfig);
            const config: LLMProviderConfig | null = await repository.findOne({
                where: { providerName, modelName }
            });
            return config ? config.toJSON() as ILLMProviderConfig : null;
        } catch (error) {
            console.error('Error finding LLM provider config:', error);
            return null;
        }
    };

    static findEnabledProviders = async (container: DependencyContainer): Promise<ILLMProviderConfig[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(LLMProviderConfig);
            const configs: LLMProviderConfig[] = await repository.findAll({
                where: { enabled: true },
                order: [['priority', 'ASC']]
            });
            return configs.map(config => config.toJSON() as ILLMProviderConfig);
        } catch (error) {
            console.error('Error finding enabled LLM providers:', error);
            return [];
        }
    };

    static findAll = async (container: DependencyContainer): Promise<ILLMProviderConfig[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(LLMProviderConfig);
            const configs: LLMProviderConfig[] = await repository.findAll({
                order: [['priority', 'ASC']]
            });
            return configs.map(config => config.toJSON() as ILLMProviderConfig);
        } catch (error) {
            console.error('Error finding all LLM providers:', error);
            return [];
        }
    };

    static create = async (
        container: DependencyContainer,
        configData: Partial<ILLMProviderConfig>
    ): Promise<ILLMProviderConfig | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(LLMProviderConfig);
            const config: LLMProviderConfig = await repository.create(configData);
            return config.toJSON() as ILLMProviderConfig;
        } catch (error) {
            console.error('Error creating LLM provider config:', error);
            return null;
        }
    };

    static update = async (
        container: DependencyContainer,
        id: string,
        updates: Partial<ILLMProviderConfig>
    ): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(LLMProviderConfig);
            const [affectedCount] = await repository.update(updates, {
                where: { id }
            });
            return affectedCount > 0;
        } catch (error) {
            console.error('Error updating LLM provider config:', error);
            return false;
        }
    };

}
