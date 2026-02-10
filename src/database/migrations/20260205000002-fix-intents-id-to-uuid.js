/**
 * Migration: Fix Intents ID to UUID
 *
 * Changes the intents.id column from INT to CHAR(36) for UUID support.
 * This is needed because the original migration may not have applied correctly.
 *
 * Tables affected:
 * - intents (id column)
 * - intent_listeners (intentId column)
 * - intent_classification_logs (intentId column)
 * - entity_collection_sessions (intentId column)
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const { v4: uuidv4 } = require('uuid');

        // Get current data before changes
        const [existingIntents] = await queryInterface.sequelize.query('SELECT * FROM intents');
        const [existingListeners] = await queryInterface.sequelize.query('SELECT * FROM intent_listeners');

        let existingLogs = [];
        try {
            const [logs] = await queryInterface.sequelize.query('SELECT * FROM intent_classification_logs');
            existingLogs = logs;
        } catch (e) {
            console.log('intent_classification_logs table may not exist');
        }

        let existingSessions = [];
        try {
            const [sessions] = await queryInterface.sequelize.query('SELECT * FROM entity_collection_sessions');
            existingSessions = sessions;
        } catch (e) {
            console.log('entity_collection_sessions table may not exist');
        }

        // Step 1: Drop foreign key constraints
        console.log('Dropping foreign key constraints...');

        try {
            await queryInterface.sequelize.query(
                'ALTER TABLE intent_classification_logs DROP FOREIGN KEY intent_classification_logs_ibfk_1'
            );
            console.log('Dropped FK: intent_classification_logs_ibfk_1');
        } catch (e) {
            console.log('FK intent_classification_logs_ibfk_1 may not exist:', e.message);
        }

        try {
            await queryInterface.sequelize.query(
                'ALTER TABLE entity_collection_sessions DROP FOREIGN KEY entity_collection_sessions_ibfk_1'
            );
            console.log('Dropped FK: entity_collection_sessions_ibfk_1');
        } catch (e) {
            console.log('FK entity_collection_sessions_ibfk_1 may not exist:', e.message);
        }

        // Step 2: Change column types
        console.log('Changing column types to VARCHAR(36)...');

        // Change intents.id - need to drop AUTO_INCREMENT first
        await queryInterface.sequelize.query(
            'ALTER TABLE intents MODIFY COLUMN id VARCHAR(36) NOT NULL'
        );
        console.log('Changed intents.id');

        // Change intent_listeners.intentId
        await queryInterface.sequelize.query(
            'ALTER TABLE intent_listeners MODIFY COLUMN intentId VARCHAR(36) NOT NULL'
        );
        console.log('Changed intent_listeners.intentId');

        // Change intent_classification_logs.intentId if exists
        try {
            await queryInterface.sequelize.query(
                'ALTER TABLE intent_classification_logs MODIFY COLUMN intentId VARCHAR(36) NULL'
            );
            console.log('Changed intent_classification_logs.intentId');
        } catch (e) {
            console.log('intent_classification_logs.intentId column may not exist');
        }

        // Change entity_collection_sessions.intentId if exists
        try {
            await queryInterface.sequelize.query(
                'ALTER TABLE entity_collection_sessions MODIFY COLUMN intentId VARCHAR(36) NULL'
            );
            console.log('Changed entity_collection_sessions.intentId');
        } catch (e) {
            console.log('entity_collection_sessions.intentId column may not exist');
        }

        // Step 3: Create ID mapping and update records
        console.log('Creating UUID mapping and updating records...');
        const idMapping = {};

        for (const intent of existingIntents) {
            const newId = uuidv4();
            idMapping[intent.id] = newId;
            await queryInterface.sequelize.query(
                'UPDATE intents SET id = ? WHERE id = ?',
                { replacements: [newId, String(intent.id)] }
            );
        }
        console.log('Updated intents with UUIDs');

        // Update intent_listeners with new IDs
        for (const listener of existingListeners) {
            if (idMapping[listener.intentId]) {
                await queryInterface.sequelize.query(
                    'UPDATE intent_listeners SET intentId = ? WHERE id = ?',
                    { replacements: [idMapping[listener.intentId], listener.id] }
                );
            }
        }
        console.log('Updated intent_listeners');

        // Update intent_classification_logs with new IDs
        for (const log of existingLogs) {
            if (log.intentId && idMapping[log.intentId]) {
                await queryInterface.sequelize.query(
                    'UPDATE intent_classification_logs SET intentId = ? WHERE id = ?',
                    { replacements: [idMapping[log.intentId], log.id] }
                );
            }
        }
        console.log('Updated intent_classification_logs');

        // Update entity_collection_sessions with new IDs
        for (const session of existingSessions) {
            if (session.intentId && idMapping[session.intentId]) {
                await queryInterface.sequelize.query(
                    'UPDATE entity_collection_sessions SET intentId = ? WHERE id = ?',
                    { replacements: [idMapping[session.intentId], session.id] }
                );
            }
        }
        console.log('Updated entity_collection_sessions');

        // Step 4: Re-add foreign key constraints
        console.log('Re-adding foreign key constraints...');

        try {
            await queryInterface.sequelize.query(`
                ALTER TABLE intent_classification_logs
                ADD CONSTRAINT intent_classification_logs_ibfk_1
                FOREIGN KEY (intentId) REFERENCES intents(id)
                ON DELETE SET NULL ON UPDATE CASCADE
            `);
            console.log('Added FK: intent_classification_logs_ibfk_1');
        } catch (e) {
            console.log('Could not add FK intent_classification_logs_ibfk_1:', e.message);
        }

        try {
            await queryInterface.sequelize.query(`
                ALTER TABLE entity_collection_sessions
                ADD CONSTRAINT entity_collection_sessions_ibfk_1
                FOREIGN KEY (intentId) REFERENCES intents(id)
                ON DELETE SET NULL ON UPDATE CASCADE
            `);
            console.log('Added FK: entity_collection_sessions_ibfk_1');
        } catch (e) {
            console.log('Could not add FK entity_collection_sessions_ibfk_1:', e.message);
        }

        console.log('Successfully converted intents.id to UUID');
        console.log('ID mapping:', idMapping);
    },

    down: async (queryInterface, Sequelize) => {
        console.log('Reverting UUID to INT is not recommended - manual intervention required');
    }
};
