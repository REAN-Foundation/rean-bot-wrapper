import { Logger } from '../../common/logger';
import {
    LLMEventObject,
    LLMListenerResponse,
    ILLMIntentListener,
    LLMListenerHandler
} from '../../refactor/interface/llm/llm.event.interfaces';

/**
 * LLM Intent Registry
 *
 * A clean, separate registry for LLM-native intent listeners.
 * This runs parallel to the legacy IntentEmitter and will eventually replace it.
 */
export class LLMIntentRegistry {
    /**
     * Map of intent codes to their listener handlers
     * Keys are lowercase for case-insensitive matching
     */
    private static listeners: Map<string, LLMListenerHandler> = new Map();

    /**
     * Register a class-based listener
     * @param listener Instance implementing ILLMIntentListener
     */
    static registerListener(listener: ILLMIntentListener): void {
        const intentCode = listener.intentCode.toLowerCase();

        if (LLMIntentRegistry.listeners.has(intentCode)) {
            Logger.instance().log(`[LLMIntentRegistry] Warning: Overwriting listener for intent: ${intentCode}`);
        }

        LLMIntentRegistry.listeners.set(intentCode, (event) => listener.handle(event));
        Logger.instance().log(`[LLMIntentRegistry] Registered listener for intent: ${intentCode}`);
    }

    /**
     * Register a function-based listener
     * @param intentCode The intent code to listen for
     * @param handler The handler function
     */
    static register(intentCode: string, handler: LLMListenerHandler): void {
        const normalizedCode = intentCode.toLowerCase();

        if (LLMIntentRegistry.listeners.has(normalizedCode)) {
            Logger.instance().log(`[LLMIntentRegistry] Warning: Overwriting listener for intent: ${normalizedCode}`);
        }

        LLMIntentRegistry.listeners.set(normalizedCode, handler);
        Logger.instance().log(`[LLMIntentRegistry] Registered handler for intent: ${normalizedCode}`);
    }

    /**
     * Check if a listener exists for an intent
     * @param intentCode The intent code to check
     */
    static has(intentCode: string): boolean {
        return LLMIntentRegistry.listeners.has(intentCode.toLowerCase());
    }

    /**
     * Get the listener for an intent (if exists)
     * @param intentCode The intent code
     */
    static get(intentCode: string): LLMListenerHandler | undefined {
        return LLMIntentRegistry.listeners.get(intentCode.toLowerCase());
    }

    /**
     * Emit an intent to trigger its listener
     * @param intentCode The intent code to emit
     * @param event The LLM event object
     * @returns The listener response, or null if no listener found
     */
    static async emit(intentCode: string, event: LLMEventObject): Promise<LLMListenerResponse | null> {
        const normalizedCode = intentCode.toLowerCase();
        const handler = LLMIntentRegistry.listeners.get(normalizedCode);

        if (!handler) {
            Logger.instance().log(`[LLMIntentRegistry] No listener found for intent: ${intentCode}`);
            return null;
        }

        try {
            Logger.instance().log(`[LLMIntentRegistry] Emitting intent: ${intentCode}`);
            const startTime = Date.now();

            const response = await handler(event);

            const duration = Date.now() - startTime;
            Logger.instance().log(`[LLMIntentRegistry] Intent ${intentCode} handled in ${duration}ms`);

            return response;
        } catch (error) {
            Logger.instance().log_error(
                `[LLMIntentRegistry] Error handling intent ${intentCode}: ${error.message}`,
                500,
                'LLMIntentRegistry.emit'
            );

            return {
                success: false,
                message: `Error handling intent: ${error.message}`,
                data: { error: error.message }
            };
        }
    }

    /**
     * Get count of registered listeners
     */
    static getListenerCount(): number {
        return LLMIntentRegistry.listeners.size;
    }

    /**
     * Get all registered intent codes
     */
    static getRegisteredIntents(): string[] {
        return Array.from(LLMIntentRegistry.listeners.keys());
    }

    /**
     * Clear all listeners (useful for testing)
     */
    static clear(): void {
        LLMIntentRegistry.listeners.clear();
    }
}
