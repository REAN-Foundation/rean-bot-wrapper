import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { IntentListeners } from "../../../models/intents/intent.listeners.model";

/**
 * Repository for intent listeners
 * Used to fetch listener configurations from the database
 */
export class IntentListenersRepo {

    /**
     * Find all enabled listeners for an intent
     * @param container DI container
     * @param intentId Intent ID
     * @returns Array of listeners ordered by sequence
     */
    static findByIntentId = async (
        container: DependencyContainer,
        intentId: string
    ): Promise<IntentListeners[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentListeners);
            const listeners = await repository.findAll({
                where: {
                    intentId,
                    enabled: true
                },
                order: [['sequence', 'ASC']]
            });
            return listeners;
        } catch (error) {
            console.error('Error finding intent listeners:', error);
            return [];
        }
    };

    /**
     * Find listener by intent ID and listener code
     * @param container DI container
     * @param intentId Intent ID
     * @param listenerCode Listener code
     * @returns Listener or null
     */
    static findByIntentAndCode = async (
        container: DependencyContainer,
        intentId: string,
        listenerCode: string
    ): Promise<IntentListeners | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentListeners);
            const listener = await repository.findOne({
                where: {
                    intentId,
                    listenerCode,
                    enabled: true
                }
            });
            return listener;
        } catch (error) {
            console.error('Error finding intent listener:', error);
            return null;
        }
    };

    /**
     * Check if an intent has any registered listeners
     * @param container DI container
     * @param intentId Intent ID
     * @returns Boolean
     */
    static hasListeners = async (
        container: DependencyContainer,
        intentId: string
    ): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentListeners);
            const count = await repository.count({
                where: {
                    intentId,
                    enabled: true
                }
            });
            return count > 0;
        } catch (error) {
            console.error('Error checking intent listeners:', error);
            return false;
        }
    };
}
