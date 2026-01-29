import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { FeatureFlag } from "../../../models/feature.flags/feature.flag.model";
import { IFeatureFlag } from "../../../refactor/interface/llm/llm.interfaces";

///////////////////////////////////////////////////////////////////////////////

export class FeatureFlagRepo {

    static findByFlagName = async (container: DependencyContainer, flagName: string): Promise<IFeatureFlag | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const featureFlagRepository = entityManager.getRepository(FeatureFlag);
            const flag: FeatureFlag | null = await featureFlagRepository.findOne(
                { where: { flagName } }
            );
            return flag ? flag.toJSON() as IFeatureFlag : null;
        } catch (error) {
            console.error('Error finding feature flag by name:', error);
            return null;
        }
    };

    static findAll = async (container: DependencyContainer): Promise<IFeatureFlag[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const featureFlagRepository = entityManager.getRepository(FeatureFlag);
            const flags: FeatureFlag[] = await featureFlagRepository.findAll();
            return flags.map(flag => flag.toJSON() as IFeatureFlag);
        } catch (error) {
            console.error('Error finding all feature flags:', error);
            return [];
        }
    };

    static findEnabledFlags = async (container: DependencyContainer): Promise<IFeatureFlag[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const featureFlagRepository = entityManager.getRepository(FeatureFlag);
            const flags: FeatureFlag[] = await featureFlagRepository.findAll(
                { where: { enabled: true } }
            );
            return flags.map(flag => flag.toJSON() as IFeatureFlag);
        } catch (error) {
            console.error('Error finding enabled feature flags:', error);
            return [];
        }
    };

    static create = async (container: DependencyContainer, flagData: Partial<IFeatureFlag>): Promise<IFeatureFlag | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const featureFlagRepository = entityManager.getRepository(FeatureFlag);
            const flag: FeatureFlag = await featureFlagRepository.create(flagData);
            return flag.toJSON() as IFeatureFlag;
        } catch (error) {
            console.error('Error creating feature flag:', error);
            return null;
        }
    };

    static update = async (container: DependencyContainer, flagName: string, updates: Partial<IFeatureFlag>): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const featureFlagRepository = entityManager.getRepository(FeatureFlag);
            const [affectedCount] = await featureFlagRepository.update(updates, {
                where: { flagName }
            });
            return affectedCount > 0;
        } catch (error) {
            console.error('Error updating feature flag:', error);
            return false;
        }
    };

    static delete = async (container: DependencyContainer, flagName: string): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const featureFlagRepository = entityManager.getRepository(FeatureFlag);
            const affectedCount = await featureFlagRepository.destroy({
                where: { flagName }
            });
            return affectedCount > 0;
        } catch (error) {
            console.error('Error deleting feature flag:', error);
            return false;
        }
    };

}
