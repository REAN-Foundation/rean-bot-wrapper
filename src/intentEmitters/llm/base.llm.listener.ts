import { Logger } from '../../common/logger';
import {
    LLMEventObject,
    LLMListenerResponse,
    ILLMIntentListener,
    EntityValue
} from '../../refactor/interface/llm/llm.event.interfaces';

/**
 * Base class for LLM-native intent listeners
 *
 * Provides common functionality for:
 * - Entity extraction helpers
 * - Response formatting
 * - Error handling
 * - Logging
 */
export abstract class BaseLLMListener implements ILLMIntentListener {
    abstract readonly intentCode: string;

    /**
     * Main handler method - must be implemented by subclasses
     */
    abstract handle(event: LLMEventObject): Promise<LLMListenerResponse>;

    /**
     * Get an entity value, with optional default
     */
    protected getEntity<T = any>(
        event: LLMEventObject,
        entityName: string,
        defaultValue?: T
    ): T | undefined {
        const entity = event.entities[entityName];
        if (entity && entity.value !== undefined && entity.value !== null) {
            return entity.value as T;
        }
        return defaultValue;
    }

    /**
     * Get an entity with full metadata
     */
    protected getEntityWithMetadata(
        event: LLMEventObject,
        entityName: string
    ): EntityValue | undefined {
        return event.entities[entityName];
    }

    /**
     * Check if an entity exists and has a value
     */
    protected hasEntity(event: LLMEventObject, entityName: string): boolean {
        const entity = event.entities[entityName];
        return entity !== undefined && entity.value !== undefined && entity.value !== null;
    }

    /**
     * Get all entity names that have values
     */
    protected getAvailableEntities(event: LLMEventObject): string[] {
        return Object.keys(event.entities).filter(key => this.hasEntity(event, key));
    }

    /**
     * Check if all required entities are present
     */
    protected hasAllEntities(event: LLMEventObject, requiredEntities: string[]): boolean {
        return requiredEntities.every(entity => this.hasEntity(event, entity));
    }

    /**
     * Get missing entities from a required list
     */
    protected getMissingEntities(event: LLMEventObject, requiredEntities: string[]): string[] {
        return requiredEntities.filter(entity => !this.hasEntity(event, entity));
    }

    /**
     * Create a success response
     */
    protected success(message: string, data?: any): LLMListenerResponse {
        return {
            success: true,
            message,
            data
        };
    }

    /**
     * Create an error response
     */
    protected error(message: string, data?: any): LLMListenerResponse {
        return {
            success: false,
            message,
            data
        };
    }

    /**
     * Resolve a service from the DI container
     */
    protected resolve<T>(event: LLMEventObject, serviceClass: new (...args: any[]) => T): T {
        return event.container.resolve(serviceClass);
    }

    /**
     * Log info message
     */
    protected log(message: string): void {
        Logger.instance().log(`[${this.intentCode}] ${message}`);
    }

    /**
     * Log error message
     */
    protected logError(message: string, error?: Error): void {
        const errorMsg = error ? `${message}: ${error.message}` : message;
        Logger.instance().log_error(errorMsg, 500, this.intentCode);
    }

    /**
     * Format a number with optional unit
     */
    protected formatWithUnit(value: number, unit?: string): string {
        if (unit) {
            return `${value} ${unit}`;
        }
        return value.toString();
    }
}
