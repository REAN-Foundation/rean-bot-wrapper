/**
 * Seeder: LLM Intent Entries
 *
 * Creates database entries for LLM-native intent listeners:
 * - Keratoplasty symptom flow (6 intents)
 * - Delete user flow (2 intents)
 *
 * These intents are handled by LLM-native listeners without Dialogflow.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        // =====================================================
        // INTENTS TABLE ENTRIES
        // =====================================================
        const intents = [
            // -------------------------------------------------
            // Keratoplasty Symptom Flow
            // -------------------------------------------------
            {
                id: uuidv4(),
                name: 'Keratoplasty Symptom Analysis',
                code: 'keratoplasty.symptom.analysis',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'keratoplasty',
                    flowType: 'symptom_analysis'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User is reporting eye-related symptoms for keratoplasty post-operative care. Analyzes symptoms and classifies by severity (Emergency/Attention Needed/Normal).',
                intentExamples: JSON.stringify([
                    'I have redness in my eye',
                    'My eye is painful',
                    'I am experiencing blurred vision',
                    'There is discharge from my eye',
                    'My eye feels itchy',
                    'I see floaters',
                    'My vision is getting worse',
                    'I have swelling around my eye'
                ]),
                entitySchema: JSON.stringify({
                    symptoms: {
                        type: 'array',
                        required: true,
                        description: 'Array of symptom strings reported by the user',
                        items: { type: 'string' },
                        followUpQuestion: 'Could you please describe your symptoms? For example: redness, pain, blurred vision, discharge, etc.'
                    }
                }),
                conversationConfig: JSON.stringify({
                    maxTurns: 5,
                    timeoutMinutes: 15,
                    followUpStrategy: 'button_based'
                }),
                confidenceThreshold: 0.75,
                fallbackToDialogflow: false,
                priority: 10,
                active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty More Symptoms',
                code: 'keratoplasty.symptom.more',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'keratoplasty',
                    flowType: 'button_handler',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User wants to report additional symptoms in the keratoplasty flow. Triggered by button click.',
                intentExamples: JSON.stringify([
                    'Yes, I have more symptoms',
                    'I want to add more symptoms',
                    'There are other symptoms'
                ]),
                entitySchema: null,
                conversationConfig: JSON.stringify({
                    maxTurns: 1,
                    timeoutMinutes: 5,
                    followUpStrategy: 'redirect_to_analysis'
                }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty Followup',
                code: 'keratoplasty.followup',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'keratoplasty',
                    flowType: 'button_handler',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User has finished reporting symptoms in keratoplasty flow. Shows cached severity message and asks for eye image.',
                intentExamples: JSON.stringify([
                    'No, that is all',
                    'That is all my symptoms',
                    'No more symptoms'
                ]),
                entitySchema: null,
                conversationConfig: JSON.stringify({
                    maxTurns: 1,
                    timeoutMinutes: 5,
                    followUpStrategy: 'image_request'
                }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                name: 'Keratoplasty Eye Image',
                code: 'keratoplasty.eye.image',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'keratoplasty',
                    flowType: 'image_collection',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User agrees to provide an eye image for keratoplasty assessment. Handles image upload and posts to ClickUp.',
                intentExamples: JSON.stringify([
                    'Yes, I can provide an image',
                    'I will send a photo',
                    'Here is my eye photo'
                ]),
                entitySchema: JSON.stringify({
                    imageUrl: {
                        type: 'string',
                        required: false,
                        description: 'URL of the uploaded eye image',
                        followUpQuestion: 'Please send a clear photo of the affected area of your eye.'
                    }
                }),
                conversationConfig: JSON.stringify({
                    maxTurns: 2,
                    timeoutMinutes: 10,
                    followUpStrategy: 'medication_question'
                }),
                confidenceThreshold: 0.85,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'Keratoplasty Response No',
                code: 'keratoplasty.response.no',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'keratoplasty',
                    flowType: 'button_handler',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User declines to provide image or answers no to medication question in keratoplasty flow.',
                intentExamples: JSON.stringify([
                    'No',
                    'No thanks',
                    'I cannot provide an image'
                ]),
                entitySchema: null,
                conversationConfig: JSON.stringify({
                    maxTurns: 1,
                    timeoutMinutes: 5,
                    followUpStrategy: 'end_conversation'
                }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'Keratoplasty Response Yes',
                code: 'keratoplasty.response.yes',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'keratoplasty',
                    flowType: 'button_handler',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User confirms they are taking medications regularly in keratoplasty flow.',
                intentExamples: JSON.stringify([
                    'Yes',
                    'Yes I am',
                    'I am taking my medications'
                ]),
                entitySchema: null,
                conversationConfig: JSON.stringify({
                    maxTurns: 1,
                    timeoutMinutes: 5,
                    followUpStrategy: 'end_conversation'
                }),
                confidenceThreshold: 0.90,
                fallbackToDialogflow: false,
                priority: 5,
                active: true,
                createdAt: now,
                updatedAt: now
            },

            // -------------------------------------------------
            // Delete User Flow
            // -------------------------------------------------
            {
                name: 'Delete User Confirm Yes',
                code: 'user.history.delete.yes',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'user_management',
                    flowType: 'button_handler',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User confirms they want to delete their data. Triggered by button click on confirmation message.',
                intentExamples: JSON.stringify([
                    'Yes, delete my data',
                    'Confirm deletion',
                    'Yes I am sure'
                ]),
                entitySchema: null,
                conversationConfig: JSON.stringify({
                    maxTurns: 1,
                    timeoutMinutes: 5,
                    followUpStrategy: 'none'
                }),
                confidenceThreshold: 0.95,
                fallbackToDialogflow: false,
                priority: 20,
                active: true,
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'Delete User Confirm No',
                code: 'user.history.delete.no',
                type: 'llm_native',
                Metadata: JSON.stringify({
                    category: 'user_management',
                    flowType: 'button_handler',
                    triggerType: 'button_click'
                }),
                llmEnabled: true,
                llmProvider: 'openai',
                intentDescription: 'User cancels data deletion request. Triggered by button click on confirmation message.',
                intentExamples: JSON.stringify([
                    'No, do not delete',
                    'Cancel deletion',
                    'Keep my data'
                ]),
                entitySchema: null,
                conversationConfig: JSON.stringify({
                    maxTurns: 1,
                    timeoutMinutes: 5,
                    followUpStrategy: 'none'
                }),
                confidenceThreshold: 0.95,
                fallbackToDialogflow: false,
                priority: 20,
                active: true,
                createdAt: now,
                updatedAt: now
            }
        ];

        // Insert intents
        await queryInterface.bulkInsert('intents', intents, {});

        // =====================================================
        // INTENT_LISTENERS TABLE ENTRIES
        // =====================================================

        // Get inserted intent IDs
        const [insertedIntents] = await queryInterface.sequelize.query(
            `SELECT id, code FROM intents WHERE code IN (
                'keratoplasty.symptom.analysis',
                'keratoplasty.symptom.more',
                'keratoplasty.followup',
                'keratoplasty.eye.image',
                'keratoplasty.response.no',
                'keratoplasty.response.yes',
                'user.history.delete.yes',
                'user.history.delete.no'
            )`
        );

        // Create a map of code to id
        const intentIdMap = {};
        insertedIntents.forEach(intent => {
            intentIdMap[intent.code] = intent.id;
        });

        // Define intent listeners
        const intentListeners = [
            // Keratoplasty listeners
            {
                intentId: intentIdMap['keratoplasty.symptom.analysis'],
                listenerCode: 'keratoplasty.symptom.analysis',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastySymptomAnalysisListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            {
                intentId: intentIdMap['keratoplasty.symptom.more'],
                listenerCode: 'keratoplasty.symptom.more',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyMoreSymptomsListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            {
                intentId: intentIdMap['keratoplasty.followup'],
                listenerCode: 'keratoplasty.followup',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyFollowupListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            {
                intentId: intentIdMap['keratoplasty.eye.image'],
                listenerCode: 'keratoplasty.eye.image',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyEyeImageListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            {
                intentId: intentIdMap['keratoplasty.response.no'],
                listenerCode: 'keratoplasty.response.no',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyResponseNoListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            {
                intentId: intentIdMap['keratoplasty.response.yes'],
                listenerCode: 'keratoplasty.response.yes',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyResponseYesListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            // Delete user listeners
            {
                intentId: intentIdMap['user.history.delete.yes'],
                listenerCode: 'user.history.delete.yes',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/delete.user.listener.ts:DeleteUserYesListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            },
            {
                intentId: intentIdMap['user.history.delete.no'],
                listenerCode: 'user.history.delete.no',
                sequence: 1,
                handlerType: 'class',
                handlerPath: 'src/intentEmitters/llm/listeners/delete.user.listener.ts:DeleteUserNoListener',
                handlerConfig: JSON.stringify({ useLLMRegistry: true }),
                enabled: true,
                executionMode: 'sequential',
                createdAt: now,
                updatedAt: now
            }
        ];

        await queryInterface.bulkInsert('intent_listeners', intentListeners, {});

        console.log('LLM Intent entries seeded successfully');
    },

    down: async (queryInterface, Sequelize) => {
        // Delete intent listeners first (foreign key constraint)
        await queryInterface.bulkDelete('intent_listeners', {
            listenerCode: {
                [Sequelize.Op.in]: [
                    'keratoplasty.symptom.analysis',
                    'keratoplasty.symptom.more',
                    'keratoplasty.followup',
                    'keratoplasty.eye.image',
                    'keratoplasty.response.no',
                    'keratoplasty.response.yes',
                    'user.history.delete.yes',
                    'user.history.delete.no'
                ]
            }
        }, {});

        // Delete intents
        await queryInterface.bulkDelete('intents', {
            code: {
                [Sequelize.Op.in]: [
                    'keratoplasty.symptom.analysis',
                    'keratoplasty.symptom.more',
                    'keratoplasty.followup',
                    'keratoplasty.eye.image',
                    'keratoplasty.response.no',
                    'keratoplasty.response.yes',
                    'user.history.delete.yes',
                    'user.history.delete.no'
                ]
            }
        }, {});

        console.log('LLM Intent entries removed');
    }
};
