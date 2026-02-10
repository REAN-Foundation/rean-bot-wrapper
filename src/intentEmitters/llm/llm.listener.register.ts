import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { LLMIntentRegistry } from './llm.intent.registry';
import { ILLMIntentListener } from '../../refactor/interface/llm/llm.event.interfaces';
import { BaseLLMListener } from './base.llm.listener';

// Import LLM-native listeners
import { BloodGlucoseListener } from './listeners/blood.glucose.listener';
import { DeleteUserYesListener, DeleteUserNoListener } from './listeners/delete.user.listener';
import {
    KeratoplastySymptomAnalysisListener,
    KeratoplastyMoreSymptomsListener,
    KeratoplastyFollowupListener,
    KeratoplastyEyeImageListener,
    KeratoplastyResponseNoListener,
    KeratoplastyResponseYesListener
} from './listeners/keratoplasty.listener';

// Type for listener class constructors
type ListenerClass = new (...args: any[]) => BaseLLMListener;

/**
 * Register all LLM-native intent listeners
 *
 * This function is called during application startup to register
 * all LLM listeners with the LLMIntentRegistry.
 *
 * To add a new listener:
 * 1. Create a listener class extending BaseLLMListener
 * 2. Import it here
 * 3. Add it to the listeners array below
 */
export function registerLLMListeners(): void {
    Logger.instance().log('[LLMListenerRegister] Starting LLM listener registration...');

    // List of all LLM listener classes
    const listenerClasses: ListenerClass[] = [
        // Biometrics
        BloodGlucoseListener,

        // User management
        DeleteUserYesListener,
        DeleteUserNoListener,

        // Keratoplasty symptom flow
        KeratoplastySymptomAnalysisListener,
        KeratoplastyMoreSymptomsListener,
        KeratoplastyFollowupListener,
        KeratoplastyEyeImageListener,
        KeratoplastyResponseNoListener,
        KeratoplastyResponseYesListener,

        // Add more listeners here as they are created:
        // CovidSymptomAssessmentListener,
        // BloodPressureListener,
        // WeightListener,
        // etc.
    ];

    // Register each listener
    for (const ListenerClass of listenerClasses) {
        try {
            // Resolve listener instance from DI container
            const listener = container.resolve<BaseLLMListener>(ListenerClass);

            // Register with the LLM Intent Registry
            LLMIntentRegistry.registerListener(listener);

            Logger.instance().log(`[LLMListenerRegister] Registered: ${listener.intentCode}`);
        } catch (error) {
            Logger.instance().log_error(
                `[LLMListenerRegister] Failed to register ${ListenerClass.name}: ${error.message}`,
                500,
                'LLMListenerRegister'
            );
        }
    }

    Logger.instance().log(
        `[LLMListenerRegister] Registration complete. Total listeners: ${LLMIntentRegistry.getListenerCount()}`
    );
}

/**
 * Get list of registered LLM intents (for debugging/diagnostics)
 */
export function getRegisteredLLMIntents(): string[] {
    return LLMIntentRegistry.getRegisteredIntents();
}
