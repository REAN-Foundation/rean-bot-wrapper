import { inject, Lifecycle, scoped } from "tsyringe";
import { FeatureFlagRepo } from "../../database/repositories/feature.flags/feature.flag.repo";
import { IFeatureFlag } from "../../refactor/interface/llm/llm.interfaces";
import * as crypto from 'crypto';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { ContainerService } from '../container/container.service';

interface FeatureFlagContext {
    userId?: string;
    intentId?: string;
    platform?: string;
}

@scoped(Lifecycle.ContainerScoped)
export class FeatureFlagService {

    // In-memory cache for feature flags (5 minute TTL)
    private cache: Map<string, { flag: IFeatureFlag, timestamp: number }> = new Map();
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider
    ) {}

    /**
     * Check if a feature flag is enabled for the given context
     * @param flagName - Name of the feature flag
     * @param context - Optional context (userId, intentId, platform)
     * @returns true if the feature is enabled, false otherwise
     */
    async isEnabled(flagName: string, context?: FeatureFlagContext): Promise<boolean> {
        try {
            const flag = await this.getFlag(flagName);

            if (!flag) {
                console.warn(`Feature flag '${flagName}' not found. Defaulting to false.`);
                return false;
            }

            // Check if flag is explicitly disabled
            if (!flag.enabled) {
                return false;
            }

            // Check if flag has expired
            if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
                console.warn(`Feature flag '${flagName}' has expired.`);
                return false;
            }

            // Check environment targeting
            const currentEnv = process.env.NODE_ENV || 'development';
            if (flag.environments && flag.environments.length > 0) {
                if (!flag.environments.includes(currentEnv)) {
                    return false;
                }
            }

            // Check intent targeting
            if (context?.intentId && flag.targetIntents && flag.targetIntents.length > 0) {
                if (!flag.targetIntents.includes(context.intentId)) {
                    return false;
                }
            }

            // Check user targeting
            if (context?.userId && flag.targetUsers && flag.targetUsers.length > 0) {
                if (!flag.targetUsers.includes(context.userId)) {
                    return false;
                }
            }

            // Check platform targeting
            if (context?.platform && flag.targetPlatforms && flag.targetPlatforms.length > 0) {
                if (!flag.targetPlatforms.includes(context.platform)) {
                    return false;
                }
            }

            // Check rollout percentage (consistent hashing)
            if (flag.rolloutPercentage < 100) {
                const userId = context?.userId || 'default';
                if (!this.isInRollout(flag.rolloutPercentage, userId)) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error(`Error checking feature flag '${flagName}':`, error);
            return false; // Fail-safe: default to disabled
        }
    }

    /**
     * Check if multiple feature flags are enabled
     * @param flagNames - Array of feature flag names
     * @param context - Optional context
     * @returns Map of flagName to boolean
     */
    async areEnabled(flagNames: string[], context?: FeatureFlagContext): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();

        for (const flagName of flagNames) {
            const isEnabled = await this.isEnabled(flagName, context);
            results.set(flagName, isEnabled);
        }

        return results;
    }

    /**
     * Get a feature flag from cache or database
     * @param flagName - Name of the feature flag
     * @returns Feature flag or null
     */
    private async getFlag(flagName: string): Promise<IFeatureFlag | null> {
        // Check cache first
        const cached = this.cache.get(flagName);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            return cached.flag;
        }

        // Fetch from database
        const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
        const container = ContainerService.createChildContainer(clientName);
        const flag = await FeatureFlagRepo.findByFlagName(container, flagName);

        if (flag) {
            // Update cache
            this.cache.set(flagName, { flag, timestamp: Date.now() });
        }

        return flag;
    }

    /**
     * Consistent hashing to determine if a user is in the rollout percentage
     * This ensures the same user always gets the same result
     * @param percentage - Rollout percentage (0-100)
     * @param userId - User identifier
     * @returns true if user is in rollout, false otherwise
     */
    private isInRollout(percentage: number, userId: string): boolean {
        // Use MD5 hash for consistent distribution
        const hash = crypto.createHash('md5').update(userId).digest('hex');

        // Convert first 8 characters of hash to integer
        const hashInt = parseInt(hash.substring(0, 8), 16);

        // Map to 0-100 range
        const bucket = hashInt % 100;

        return bucket < percentage;
    }

    /**
     * Clear the cache (useful for testing or when flags are updated)
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get all feature flags
     * @returns Array of all feature flags
     */
    async getAllFlags(): Promise<IFeatureFlag[]> {
        try {
            const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
            const container = ContainerService.createChildContainer(clientName);
            return await FeatureFlagRepo.findAll(container);
        } catch (error) {
            console.error('Error getting all feature flags:', error);
            return [];
        }
    }

    /**
     * Get all enabled feature flags
     * @returns Array of enabled feature flags
     */
    async getEnabledFlags(): Promise<IFeatureFlag[]> {
        try {
            const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
            const container = ContainerService.createChildContainer(clientName);
            return await FeatureFlagRepo.findEnabledFlags(container);
        } catch (error) {
            console.error('Error getting enabled feature flags:', error);
            return [];
        }
    }

    /**
     * Update a feature flag
     * @param flagName - Name of the feature flag
     * @param updates - Partial updates to apply
     * @returns true if successful, false otherwise
     */
    async updateFlag(flagName: string, updates: Partial<IFeatureFlag>): Promise<boolean> {
        try {
            const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
            const container = ContainerService.createChildContainer(clientName);
            const success = await FeatureFlagRepo.update(container, flagName, updates);
            if (success) {
                // Clear cache for this flag
                this.cache.delete(flagName);
            }
            return success;
        } catch (error) {
            console.error(`Error updating feature flag '${flagName}':`, error);
            return false;
        }
    }

    /**
     * Create a new feature flag
     * @param flagData - Feature flag data
     * @returns Created feature flag or null
     */
    async createFlag(flagData: Partial<IFeatureFlag>): Promise<IFeatureFlag | null> {
        try {
            const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
            const container = ContainerService.createChildContainer(clientName);
            return await FeatureFlagRepo.create(container, flagData);
        } catch (error) {
            console.error('Error creating feature flag:', error);
            return null;
        }
    }

    /**
     * Delete a feature flag
     * @param flagName - Name of the feature flag
     * @returns true if successful, false otherwise
     */
    async deleteFlag(flagName: string): Promise<boolean> {
        try {
            const clientName = await this.environmentProviderService.getClientEnvironmentVariable("Name");
            const container = ContainerService.createChildContainer(clientName);
            const success = await FeatureFlagRepo.delete(container, flagName);
            if (success) {
                // Clear cache for this flag
                this.cache.delete(flagName);
            }
            return success;
        } catch (error) {
            console.error(`Error deleting feature flag '${flagName}':`, error);
            return false;
        }
    }
}
