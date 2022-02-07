import { Logger } from '../common/logger';

export class IntentEmitter {

    // Static Map of Intent: Listeners
    static _intentListenersMap = new Map();

    // Register the Intent with a listener
    static registerListener(intent, listener) {
        Logger.instance().log(`Register an Intent: ${intent} with listener.`);

        const topic = intent.toLowerCase();
        if (!IntentEmitter._intentListenersMap.has(topic)) {
            const listeners = [];
            listeners.push(listener);
            IntentEmitter._intentListenersMap.set(topic, listeners);
        }
        else {
            const listeners = IntentEmitter._intentListenersMap.get(topic);
            listeners.push(listener);
            IntentEmitter._intentListenersMap.set(topic, listeners);
        }
    }

    // Custom Intent Emitter with PromiseHandlers
    static emit = async (intent, eventObj) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                let consolidatedResponse = null;

                Logger.instance().log(`Processing Intent ${intent}`);

                const listeners = IntentEmitter.getIntentListeners(intent);
                const promises = [];
                for (const listener of listeners) {
                    promises.push(listener(intent, eventObj));
                }
                consolidatedResponse = await Promise.allSettled(promises);

                // TODO: implement here - if we need to consolidated output to be sent - varies per Intent
                resolve(consolidatedResponse);

            } catch (error) {
                Logger.instance().log_error(error.message, 500, "IntentEmitterException!");
                reject('Error: IntentFulfillmentException!');
            }
        });
    };

    // Get listeners already registered for given intent
    static getIntentListeners(intent) {
        const topic = intent.toLowerCase();
        if (IntentEmitter._intentListenersMap.has(topic)) {
            const listeners = IntentEmitter._intentListenersMap.get(topic);
            return listeners;
        }

        return [];
    }

    // Get listener count already registered for given intent
    static getIntentListenerCount(intent) {
        const topic = intent.toLowerCase();
        if (IntentEmitter._intentListenersMap.has(topic)) {
            const listeners = IntentEmitter._intentListenersMap.get(topic);
            return listeners.length;
        }

        return 0;
    }

}
