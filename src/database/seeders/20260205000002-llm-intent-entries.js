/**
 * Seeder: LLM Intent Entries
 *
 * Creates database entries for LLM-native intents with new response configuration:
 * - Static intents (Welcome, FAQ) - Just return message + buttons
 * - Listener intents (Keratoplasty, Delete User) - Execute business logic
 *
 * Response Types:
 * - static: Return staticResponse directly
 * - listener: Execute registered handlers
 * - hybrid: Return staticResponse AND trigger handler async
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        const intents = [
            // =====================================================
            // STATIC INTENTS - No listener needed, just message + buttons
            // =====================================================
            {
                id: uuidv4(),
                name: 'Default Welcome',
                code: 'default.welcome',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'general', flowType: 'welcome' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User greets the bot or starts a conversation',
                intentExamples: JSON.stringify([
                    'Hi', 'Hello', 'Hey', 'Good morning', 'Good afternoon',
                    'Start', 'Begin', 'Help me', 'I need help'
                ]),
                entitySchema: null,
                conversationConfig: null,
                confidenceThreshold: 0.70,
                fallbackToDialogflow: false,
                priority: 100,
                active: true,
                responseType: 'static',
                staticResponse: JSON.stringify({
                    message: 'Welcome! How can I assist you today?',
                    buttons: [
                        { text: 'Report Symptoms', type: 'intent', value: 'keratoplasty.symptom.analysis' },
                        { text: 'Check My Reminders', type: 'intent', value: 'reminder.list' },
                        { text: 'Delete My Data', type: 'intent', value: 'user.history.delete.confirm' }
                    ]
                }),
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'FAQ General',
                code: 'faq.general',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'general', flowType: 'faq' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User asks general questions about the service',
                intentExamples: JSON.stringify([
                    'What can you do', 'What services do you offer', 'How does this work',
                    'Tell me about yourself', 'What is this bot for'
                ]),
                entitySchema: null,
                conversationConfig: null,
                confidenceThreshold: 0.75,
                fallbackToDialogflow: false,
                priority: 50,
                active: true,
                responseType: 'static',
                staticResponse: JSON.stringify({
                    message: 'I can help you with:\n• Tracking and reporting symptoms\n• Managing medication reminders\n• Answering health-related questions\n\nHow would you like me to help you today?',
                    buttons: [
                        { text: 'Report Symptoms', type: 'intent', value: 'keratoplasty.symptom.analysis' },
                        { text: 'Set a Reminder', type: 'intent', value: 'reminder.create' }
                    ]
                }),
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Delete User Confirmation Request',
                code: 'user.history.delete.confirm',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'user_management', flowType: 'confirmation' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User wants to delete their data - show confirmation',
                intentExamples: JSON.stringify([
                    'Delete my data', 'Remove my account', 'Erase my history',
                    'Delete everything about me', 'I want to delete my profile'
                ]),
                entitySchema: null,
                conversationConfig: null,
                confidenceThreshold: 0.85,
                fallbackToDialogflow: false,
                priority: 30,
                active: true,
                responseType: 'static',
                staticResponse: JSON.stringify({
                    message: 'Are you sure you want to delete all your data? This action cannot be undone.',
                    buttons: [
                        { text: 'Yes, delete my data', type: 'intent', value: 'user.history.delete.yes' },
                        { text: 'No, keep my data', type: 'intent', value: 'user.history.delete.no' }
                    ]
                }),
                createdAt: now,
                updatedAt: now
            },

            // =====================================================
            // LISTENER INTENTS - Execute business logic
            // =====================================================

            // Keratoplasty Symptom Flow
            {
                id: uuidv4(),
                name: 'Keratoplasty Symptom Analysis',
                code: 'keratoplasty.symptom.analysis',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'keratoplasty', flowType: 'symptom_analysis' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User is reporting eye-related symptoms for keratoplasty post-operative care.',
                intentExamples: JSON.stringify([
                    'I have redness in my eye', 'My eye is painful',
                    'I am experiencing blurred vision', 'There is discharge from my eye',
                    'My eye feels itchy', 'I see floaters'
                ]),
                entitySchema: JSON.stringify({
                    symptoms: {
                        type: 'array',
                        required: true,
                        description: 'Array of symptom strings',
                        followUpQuestion: 'Could you please describe your symptoms?'
                    }
                }),
                conversationConfig: JSON.stringify({ maxTurns: 5, timeoutMinutes: 15 }),
                confidenceThreshold: 0.75,
                fallbackToDialogflow: false,
                priority: 10,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty More Symptoms',
                code: 'keratoplasty.symptom.more',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'keratoplasty', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User wants to report additional symptoms.',
                intentExamples: JSON.stringify(['Yes, I have more symptoms']),
                entitySchema: null,
                conversationConfig: JSON.stringify({ maxTurns: 1 }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty Followup',
                code: 'keratoplasty.followup',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'keratoplasty', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User finished reporting symptoms.',
                intentExamples: JSON.stringify(['No, that is all']),
                entitySchema: null,
                conversationConfig: JSON.stringify({ maxTurns: 1 }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty Eye Image',
                code: 'keratoplasty.eye.image',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'keratoplasty', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User agrees to provide an eye image.',
                intentExamples: JSON.stringify(['Yes, I can provide an image']),
                entitySchema: JSON.stringify({ imageUrl: { type: 'string', required: false } }),
                conversationConfig: JSON.stringify({ maxTurns: 2 }),
                confidenceThreshold: 0.85,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty Response No',
                code: 'keratoplasty.response.no',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'keratoplasty', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User declines in keratoplasty flow.',
                intentExamples: JSON.stringify(['No', 'No thanks']),
                entitySchema: null,
                conversationConfig: JSON.stringify({ maxTurns: 1 }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty Response Yes',
                code: 'keratoplasty.response.yes',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'keratoplasty', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User confirms medication compliance.',
                intentExamples: JSON.stringify(['Yes', 'Yes I am']),
                entitySchema: null,
                conversationConfig: JSON.stringify({ maxTurns: 1 }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },

            // Delete User Confirmation Handlers
            {
                id: uuidv4(),
                name: 'Delete User Confirm Yes',
                code: 'user.history.delete.yes',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'user_management', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User confirms data deletion.',
                intentExamples: JSON.stringify(['Yes, delete my data']),
                entitySchema: null,
                conversationConfig: JSON.stringify({ maxTurns: 1 }),
                confidenceThreshold: 0.95,
                fallbackToDialogflow: false,
                priority: 20,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Delete User Confirm No',
                code: 'user.history.delete.no',
                type: 'llm_native',
                Metadata: JSON.stringify({ category: 'user_management', triggerType: 'button_click' }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User cancels data deletion.',
                intentExamples: JSON.stringify(['No, do not delete']),
                entitySchema: null,
                conversationConfig: JSON.stringify({ maxTurns: 1 }),
                confidenceThreshold: 0.95,
                fallbackToDialogflow: false,
                priority: 20,
                active: true,
                responseType: 'listener',
                staticResponse: null,
                createdAt: now,
                updatedAt: now
            }
        ];

        // Insert intents
        await queryInterface.bulkInsert('intents', intents, {});

        // Get inserted intent IDs for listener mappings
        const listenerIntentCodes = [
            'keratoplasty.symptom.analysis', 'keratoplasty.symptom.more', 'keratoplasty.followup',
            'keratoplasty.eye.image', 'keratoplasty.response.no', 'keratoplasty.response.yes',
            'user.history.delete.yes', 'user.history.delete.no'
        ];

        const [insertedIntents] = await queryInterface.sequelize.query(
            `SELECT id, code FROM intents WHERE code IN (${listenerIntentCodes.map(() => '?').join(',')})`,
            { replacements: listenerIntentCodes }
        );

        const intentIdMap = {};
        insertedIntents.forEach(intent => { intentIdMap[intent.code] = intent.id; });

        // Intent listeners (only for listener-based intents)
        const intentListeners = [
            { intentId: intentIdMap['keratoplasty.symptom.analysis'], listenerCode: 'keratoplasty.symptom.analysis', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastySymptomAnalysisListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['keratoplasty.symptom.more'], listenerCode: 'keratoplasty.symptom.more', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyMoreSymptomsListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['keratoplasty.followup'], listenerCode: 'keratoplasty.followup', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyFollowupListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['keratoplasty.eye.image'], listenerCode: 'keratoplasty.eye.image', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyEyeImageListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['keratoplasty.response.no'], listenerCode: 'keratoplasty.response.no', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyResponseNoListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['keratoplasty.response.yes'], listenerCode: 'keratoplasty.response.yes', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyResponseYesListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['user.history.delete.yes'], listenerCode: 'user.history.delete.yes', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/delete.user.listener.ts:DeleteUserYesListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now },
            { intentId: intentIdMap['user.history.delete.no'], listenerCode: 'user.history.delete.no', sequence: 1, handlerType: 'class', handlerPath: 'src/intentEmitters/llm/listeners/delete.user.listener.ts:DeleteUserNoListener', handlerConfig: JSON.stringify({ useLLMRegistry: true }), enabled: true, executionMode: 'sequential', createdAt: now, updatedAt: now }
        ];

        await queryInterface.bulkInsert('intent_listeners', intentListeners, {});
        console.log('LLM Intent entries seeded successfully');
    },

    down: async (queryInterface, Sequelize) => {
        const codes = [
            'default.welcome', 'faq.general', 'user.history.delete.confirm',
            'keratoplasty.symptom.analysis', 'keratoplasty.symptom.more', 'keratoplasty.followup',
            'keratoplasty.eye.image', 'keratoplasty.response.no', 'keratoplasty.response.yes',
            'user.history.delete.yes', 'user.history.delete.no'
        ];
        await queryInterface.bulkDelete('intent_listeners', { listenerCode: { [Sequelize.Op.in]: codes } }, {});
        await queryInterface.bulkDelete('intents', { code: { [Sequelize.Op.in]: codes } }, {});
    }
};
