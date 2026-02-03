import { inject, Lifecycle, scoped } from 'tsyringe';
import { CacheMemory } from '../../cache.memory.service';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import {
    EntityCollectionContext,
    SessionState,
    SessionTransitionResult,
    EntityDefinition,
    ExtractedEntity
} from '../../../refactor/interface/llm/entity.collection.interfaces';

@scoped(Lifecycle.ContainerScoped)
export class EntityCollectionStateMachine {

    private readonly CACHE_PREFIX = 'entity_collection';
    private readonly STATE_TTL_MINUTES = 30;

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider
    ) {}

    /**
     * Initialize a new entity collection session
     */
    async initializeSession(
        sessionId: string,
        intentId: string,
        intentCode: string,
        userPlatformId: string,
        requiredEntities: EntityDefinition[],
        maxTurns: number = 5
    ): Promise<EntityCollectionContext> {

        const timeoutAt = new Date();
        timeoutAt.setMinutes(timeoutAt.getMinutes() + this.STATE_TTL_MINUTES);

        const context: EntityCollectionContext = {
            sessionId,
            intentId,
            intentCode,
            userPlatformId,
            requiredEntities,
            collectedEntities: new Map(),
            conversationHistory: [],
            currentState: SessionState.INITIALIZED,
            currentTurn: 0,
            maxTurns,
            timeoutAt
        };

        await this.saveContext(context);
        return context;
    }

    /**
     * Get current session context
     */
    async getContext(sessionId: string): Promise<EntityCollectionContext | null> {
        const key = this.getCacheKey(sessionId);
        const cached = await CacheMemory.get(key);

        if (!cached) {
            return null;
        }

        return this.deserializeContext(cached);
    }

    /**
     * Transition to next state based on current state and conditions
     */
    async transition(
        context: EntityCollectionContext,
        collectedEntities: ExtractedEntity[]
    ): Promise<SessionTransitionResult> {

        // Update collected entities
        for (const entity of collectedEntities) {
            context.collectedEntities.set(entity.name, entity);
        }

        // Check timeout
        if (new Date() > context.timeoutAt) {
            return await this.transitionTo(context, SessionState.TIMEOUT);
        }

        // Check max turns
        if (context.currentTurn >= context.maxTurns) {
            const missingRequired = this.getMissingRequiredEntities(context);
            if (missingRequired.length > 0) {
                return await this.transitionTo(context, SessionState.ABANDONED);
            }
        }

        // State machine logic
        switch (context.currentState) {
            case SessionState.INITIALIZED:
                return await this.handleInitializedState(context);

            case SessionState.COLLECTING:
                return await this.handleCollectingState(context);

            case SessionState.VALIDATING:
                return await this.handleValidatingState(context);

            default:
                throw new Error(`Invalid state: ${context.currentState}`);
        }
    }

    /**
     * Handle INITIALIZED state
     */
    private async handleInitializedState(
        context: EntityCollectionContext
    ): Promise<SessionTransitionResult> {

        const missingEntities = this.getMissingRequiredEntities(context);

        if (missingEntities.length === 0) {
            return await this.transitionTo(context, SessionState.VALIDATING);
        }

        return await this.transitionTo(context, SessionState.COLLECTING);
    }

    /**
     * Handle COLLECTING state
     */
    private async handleCollectingState(
        context: EntityCollectionContext
    ): Promise<SessionTransitionResult> {

        const missingEntities = this.getMissingRequiredEntities(context);

        if (missingEntities.length === 0) {
            return await this.transitionTo(context, SessionState.VALIDATING);
        }

        // Continue collecting
        context.currentTurn++;
        await this.saveContext(context);

        return {
            newState: SessionState.COLLECTING,
            action: 'ask_question',
            data: {
                missingEntities,
                nextEntity: missingEntities[0]
            }
        };
    }

    /**
     * Handle VALIDATING state
     */
    private async handleValidatingState(
        context: EntityCollectionContext
    ): Promise<SessionTransitionResult> {

        // Check if all entities are valid
        const invalidEntities = Array.from(context.collectedEntities.values())
            .filter(e => e.validationStatus === 'invalid');

        if (invalidEntities.length > 0) {
            // Go back to collecting for invalid entities
            context.currentState = SessionState.COLLECTING;
            await this.saveContext(context);

            return {
                newState: SessionState.COLLECTING,
                action: 'ask_question',
                data: {
                    invalidEntities: invalidEntities.map(e => e.name),
                    needsClarification: true
                }
            };
        }

        return await this.transitionTo(context, SessionState.COMPLETED);
    }

    /**
     * Transition to a new state
     */
    private async transitionTo(
        context: EntityCollectionContext,
        newState: SessionState
    ): Promise<SessionTransitionResult> {

        context.currentState = newState;
        await this.saveContext(context);

        let action: SessionTransitionResult['action'];

        switch (newState) {
            case SessionState.COLLECTING:
                action = 'ask_question';
                break;
            case SessionState.VALIDATING:
                action = 'validate';
                break;
            case SessionState.COMPLETED:
                action = 'complete';
                break;
            case SessionState.ABANDONED:
            case SessionState.TIMEOUT:
                action = 'abandon';
                break;
            default:
                action = 'continue';
        }

        return { newState, action };
    }

    /**
     * Get missing required entities
     */
    private getMissingRequiredEntities(context: EntityCollectionContext): string[] {
        return context.requiredEntities
            .filter(def => def.required)
            .filter(def => !context.collectedEntities.has(def.name))
            .map(def => def.name);
    }

    /**
     * Save context to cache
     */
    private async saveContext(context: EntityCollectionContext): Promise<void> {
        const key = this.getCacheKey(context.sessionId);
        const serialized = this.serializeContext(context);
        await CacheMemory.set(key, serialized);
    }

    /**
     * Get cache key for session
     */
    private getCacheKey(sessionId: string): string {
        return `${this.CACHE_PREFIX}:${sessionId}`;
    }

    /**
     * Serialize context for caching
     */
    private serializeContext(context: EntityCollectionContext): string {
        return JSON.stringify({
            ...context,
            collectedEntities: Array.from(context.collectedEntities.entries())
        });
    }

    /**
     * Deserialize context from cache
     */
    private deserializeContext(serialized: string): EntityCollectionContext {
        const parsed = JSON.parse(serialized);
        return {
            ...parsed,
            collectedEntities: new Map(parsed.collectedEntities),
            timeoutAt: new Date(parsed.timeoutAt)
        };
    }

    /**
     * Clear session from cache
     */
    async clearSession(sessionId: string): Promise<void> {
        const key = this.getCacheKey(sessionId);
        await CacheMemory.delete(key);
    }
}
