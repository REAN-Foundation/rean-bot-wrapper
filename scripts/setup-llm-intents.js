/**
 * Script: Setup LLM Intents
 *
 * Standalone script to add LLM-native intent entries to the database.
 * Can be run directly: node scripts/setup-llm-intents.js
 *
 * This script:
 * 1. Adds intent entries to the 'intents' table
 * 2. Adds listener mappings to the 'intent_listeners' table
 * 3. Adds feature flags for gradual rollout
 *
 * Usage:
 *   node scripts/setup-llm-intents.js
 *   node scripts/setup-llm-intents.js --rollback  # Remove entries
 */

const { Sequelize, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false
    }
);

// =====================================================
// INTENT DEFINITIONS
// =====================================================

const LLM_INTENTS = [
    // Keratoplasty Symptom Flow
    {
        name: 'Keratoplasty Symptom Analysis',
        code: 'keratoplasty.symptom.analysis',
        type: 'llm_native',
        Metadata: JSON.stringify({ category: 'keratoplasty', flowType: 'symptom_analysis' }),
        llmEnabled: true,
        llmProvider: 'openai',
        intentDescription: 'User is reporting eye-related symptoms for keratoplasty post-operative care.',
        intentExamples: JSON.stringify([
            'I have redness in my eye',
            'My eye is painful',
            'I am experiencing blurred vision',
            'There is discharge from my eye'
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
        active: true
    },
    {
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
        active: true
    },
    {
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
        active: true
    },
    {
        name: 'Keratoplasty Eye Image',
        code: 'keratoplasty.eye.image',
        type: 'llm_native',
        Metadata: JSON.stringify({ category: 'keratoplasty', triggerType: 'button_click' }),
        llmEnabled: true,
        llmProvider: 'openai',
        intentDescription: 'User agrees to provide an eye image.',
        intentExamples: JSON.stringify(['Yes, I can provide an image']),
        entitySchema: JSON.stringify({
            imageUrl: { type: 'string', required: false, description: 'Eye image URL' }
        }),
        conversationConfig: JSON.stringify({ maxTurns: 2 }),
        confidenceThreshold: 0.85,
        fallbackToDialogflow: false,
        priority: 5,
        active: true
    },
    {
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
        active: true
    },
    {
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
        active: true
    },

    // Delete User Flow
    {
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
        active: true
    },
    {
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
        active: true
    }
];

// Listener mappings
const LISTENER_MAPPINGS = {
    'keratoplasty.symptom.analysis': {
        handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastySymptomAnalysisListener'
    },
    'keratoplasty.symptom.more': {
        handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyMoreSymptomsListener'
    },
    'keratoplasty.followup': {
        handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyFollowupListener'
    },
    'keratoplasty.eye.image': {
        handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyEyeImageListener'
    },
    'keratoplasty.response.no': {
        handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyResponseNoListener'
    },
    'keratoplasty.response.yes': {
        handlerPath: 'src/intentEmitters/llm/listeners/keratoplasty.listener.ts:KeratoplastyResponseYesListener'
    },
    'user.history.delete.yes': {
        handlerPath: 'src/intentEmitters/llm/listeners/delete.user.listener.ts:DeleteUserYesListener'
    },
    'user.history.delete.no': {
        handlerPath: 'src/intentEmitters/llm/listeners/delete.user.listener.ts:DeleteUserNoListener'
    }
};

// Feature flags
const FEATURE_FLAGS = [
    {
        flagName: 'llmIntent_keratoplasty_symptom_analysis',
        description: 'Enable LLM-native keratoplasty symptom analysis',
        targetIntents: ['keratoplasty.symptom.analysis']
    },
    {
        flagName: 'llmIntent_keratoplasty_flow',
        description: 'Enable all keratoplasty flow intents',
        targetIntents: [
            'keratoplasty.symptom.analysis',
            'keratoplasty.symptom.more',
            'keratoplasty.followup',
            'keratoplasty.eye.image',
            'keratoplasty.response.no',
            'keratoplasty.response.yes'
        ]
    },
    {
        flagName: 'llmIntent_user_history_delete',
        description: 'Enable user history deletion intents',
        targetIntents: ['user.history.delete.yes', 'user.history.delete.no']
    }
];

// =====================================================
// MAIN FUNCTIONS
// =====================================================

async function setup() {
    const transaction = await sequelize.transaction();
    const now = new Date();

    try {
        console.log('Setting up LLM intents...\n');

        // 1. Insert intents
        console.log('1. Inserting intents...');
        for (const intent of LLM_INTENTS) {
            const [existing] = await sequelize.query(
                'SELECT id FROM intents WHERE code = ?',
                { replacements: [intent.code], transaction }
            );

            if (existing.length > 0) {
                console.log(`   - ${intent.code} already exists, skipping`);
                continue;
            }

            await sequelize.query(
                `INSERT INTO intents (name, code, type, Metadata, llmEnabled, llmProvider, intentDescription, intentExamples, entitySchema, conversationConfig, confidenceThreshold, fallbackToDialogflow, priority, active, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        intent.name, intent.code, intent.type, intent.Metadata,
                        intent.llmEnabled, intent.llmProvider, intent.intentDescription,
                        intent.intentExamples, intent.entitySchema, intent.conversationConfig,
                        intent.confidenceThreshold, intent.fallbackToDialogflow, intent.priority,
                        intent.active, now, now
                    ],
                    transaction
                }
            );
            console.log(`   + ${intent.code}`);
        }

        // 2. Insert intent listeners
        console.log('\n2. Inserting intent listeners...');
        for (const [code, mapping] of Object.entries(LISTENER_MAPPINGS)) {
            const [intentRows] = await sequelize.query(
                'SELECT id FROM intents WHERE code = ?',
                { replacements: [code], transaction }
            );

            if (intentRows.length === 0) {
                console.log(`   - ${code} intent not found, skipping listener`);
                continue;
            }

            const intentId = intentRows[0].id;

            const [existing] = await sequelize.query(
                'SELECT id FROM intent_listeners WHERE intentId = ? AND listenerCode = ?',
                { replacements: [intentId, code], transaction }
            );

            if (existing.length > 0) {
                console.log(`   - ${code} listener already exists, skipping`);
                continue;
            }

            await sequelize.query(
                `INSERT INTO intent_listeners (intentId, listenerCode, sequence, handlerType, handlerPath, handlerConfig, enabled, executionMode, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        intentId, code, 1, 'class', mapping.handlerPath,
                        JSON.stringify({ useLLMRegistry: true }), true, 'sequential', now, now
                    ],
                    transaction
                }
            );
            console.log(`   + ${code}`);
        }

        // 3. Insert feature flags
        console.log('\n3. Inserting feature flags...');
        for (const flag of FEATURE_FLAGS) {
            const [existing] = await sequelize.query(
                'SELECT id FROM feature_flags WHERE flagName = ?',
                { replacements: [flag.flagName], transaction }
            );

            if (existing.length > 0) {
                console.log(`   - ${flag.flagName} already exists, skipping`);
                continue;
            }

            await sequelize.query(
                `INSERT INTO feature_flags (id, flagName, description, enabled, rolloutPercentage, targetIntents, environments, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        uuidv4(), flag.flagName, flag.description, false, 0,
                        JSON.stringify(flag.targetIntents),
                        JSON.stringify(['development', 'staging']),
                        now, now
                    ],
                    transaction
                }
            );
            console.log(`   + ${flag.flagName}`);
        }

        await transaction.commit();
        console.log('\nSetup complete!');

    } catch (error) {
        await transaction.rollback();
        console.error('Setup failed:', error.message);
        throw error;
    }
}

async function rollback() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Rolling back LLM intents...\n');

        const intentCodes = LLM_INTENTS.map(i => i.code);
        const flagNames = FEATURE_FLAGS.map(f => f.flagName);

        // 1. Delete intent listeners
        console.log('1. Deleting intent listeners...');
        await sequelize.query(
            `DELETE FROM intent_listeners WHERE listenerCode IN (?)`,
            { replacements: [intentCodes], transaction }
        );
        console.log('   Done');

        // 2. Delete intents
        console.log('2. Deleting intents...');
        await sequelize.query(
            `DELETE FROM intents WHERE code IN (?)`,
            { replacements: [intentCodes], transaction }
        );
        console.log('   Done');

        // 3. Delete feature flags
        console.log('3. Deleting feature flags...');
        await sequelize.query(
            `DELETE FROM feature_flags WHERE flagName IN (?)`,
            { replacements: [flagNames], transaction }
        );
        console.log('   Done');

        await transaction.commit();
        console.log('\nRollback complete!');

    } catch (error) {
        await transaction.rollback();
        console.error('Rollback failed:', error.message);
        throw error;
    }
}

// =====================================================
// CLI
// =====================================================

async function main() {
    const args = process.argv.slice(2);
    const isRollback = args.includes('--rollback');

    try {
        await sequelize.authenticate();
        console.log('Database connected\n');

        if (isRollback) {
            await rollback();
        } else {
            await setup();
        }

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

main();
