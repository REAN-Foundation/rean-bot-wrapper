/**
 * Seeder: Add intent_listeners record for findNearestLocation
 *
 * Date: 2026-03-14
 * Purpose: Register the FindNearestLocationListener for the findNearestLocation intent
 *
 * This seeder adds the missing intent_listeners record for the findNearestLocation intent
 * that was migrated from Dialogflow. The intent already exists in the database but needs
 * to be linked to the LLM listener class.
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        console.log('[FindNearestLocation Listener] Starting setup...');

        // =====================================================
        // STEP 1: Get the intent ID for findNearestLocation
        // =====================================================
        const [intents] = await queryInterface.sequelize.query(
            `SELECT id FROM intents WHERE code = 'findNearestLocation' LIMIT 1`
        );

        if (intents.length === 0) {
            console.error('[ERROR] Intent "findNearestLocation" not found in database!');
            console.error('Please run the Dialogflow migration seeder first: 20260311141407-dialogflow-lvpei-intents.js');
            throw new Error('Intent "findNearestLocation" not found');
        }

        const intentId = intents[0].id;
        console.log(`[FindNearestLocation Listener] Found intent with ID: ${intentId}`);

        // =====================================================
        // STEP 2: Check if listener already exists
        // =====================================================
        const [existingListeners] = await queryInterface.sequelize.query(
            `SELECT id FROM intent_listeners WHERE listenerCode = 'findNearestLocation'`
        );

        if (existingListeners.length > 0) {
            console.log('[FindNearestLocation Listener] Listener already exists, deleting before re-creating...');
            await queryInterface.bulkDelete('intent_listeners', {
                listenerCode: 'findNearestLocation'
            }, {});
        }

        // =====================================================
        // STEP 3: Create intent_listeners record
        // =====================================================
        const intentListener = {
            intentId: intentId,
            listenerCode: 'findNearestLocation',
            sequence: 1,
            handlerType: 'class',
            handlerPath: 'src/intentEmitters/llm/listeners/nearest.location.listener.ts:FindNearestLocationListener',
            handlerConfig: JSON.stringify({ useLLMRegistry: true }),
            enabled: true,
            executionMode: 'sequential',
            createdAt: now,
            updatedAt: now
        };

        await queryInterface.bulkInsert('intent_listeners', [intentListener], {});

        console.log('[FindNearestLocation Listener] ✅ Successfully registered listener');
        console.log('  - Intent Code: findNearestLocation');
        console.log('  - Listener Class: FindNearestLocationListener');
        console.log('  - Handler Path: src/intentEmitters/llm/listeners/nearest.location.listener.ts');
        console.log('  - Uses LLM Registry: true');
    },

    down: async (queryInterface, Sequelize) => {
        console.log('[FindNearestLocation Listener] Removing listener registration...');

        await queryInterface.bulkDelete('intent_listeners', {
            listenerCode: 'findNearestLocation'
        }, {});

        console.log('[FindNearestLocation Listener] ✅ Listener removed');
    }
};
