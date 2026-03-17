#!/usr/bin/env node

/**
 * Verification Script for Dialogflow Replacement Migrations
 *
 * This script verifies that all database migrations for the Dialogflow replacement
 * have been successfully applied.
 *
 * Usage:
 *   node scripts/verify-dialogflow-migrations.js
 *
 * Environment Variables:
 *   NODE_ENV - Environment to verify (development, uat, production)
 */

const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');

// ANSI color codes for better readability
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyMigrations() {
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = config[env];

    log(`\n${'='.repeat(70)}`, 'cyan');
    log('Dialogflow Replacement Migration Verification', 'bright');
    log(`Environment: ${env}`, 'bright');
    log(`Database: ${dbConfig.database}@${dbConfig.host}`, 'bright');
    log(`${'='.repeat(70)}\n`, 'cyan');

    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            dialect: dbConfig.dialect,
            port: dbConfig.port,
            logging: false
        }
    );

    let allChecksPassed = true;

    try {
        // Test connection
        await sequelize.authenticate();
        log('✓ Database connection successful\n', 'green');

        // ==========================================
        // Check 1: Verify New Tables Exist
        // ==========================================
        log('Check 1: Verifying new tables exist...', 'cyan');
        const [tables] = await sequelize.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);

        const requiredTables = [
            'intent_listeners',
            'feature_flags',
            'llm_provider_config',
            'intent_classification_logs',
            'entity_collection_sessions'
        ];

        for (const table of requiredTables) {
            const exists = tableNames.includes(table);
            if (exists) {
                log(`  ✓ ${table}`, 'green');
            } else {
                log(`  ✗ ${table} - MISSING`, 'red');
                allChecksPassed = false;
            }
        }

        // ==========================================
        // Check 2: Verify intents Table Columns
        // ==========================================
        log('\nCheck 2: Verifying intents table columns...', 'cyan');
        const [intentColumns] = await sequelize.query("DESCRIBE intents");
        const intentColumnNames = intentColumns.map(c => c.Field);

        const requiredIntentColumns = [
            'llmEnabled',
            'llmProvider',
            'intentDescription',
            'intentExamples',
            'entitySchema',
            'conversationConfig',
            'confidenceThreshold',
            'fallbackToDialogflow',
            'priority',
            'active',
            'responseType',
            'staticResponse'
        ];

        for (const col of requiredIntentColumns) {
            const exists = intentColumnNames.includes(col);
            if (exists) {
                log(`  ✓ intents.${col}`, 'green');
            } else {
                log(`  ✗ intents.${col} - MISSING`, 'red');
                allChecksPassed = false;
            }
        }

        // ==========================================
        // Check 3: Verify intents.id Type (UUID)
        // ==========================================
        log('\nCheck 3: Verifying intents.id type (UUID)...', 'cyan');
        const idColumn = intentColumns.find(c => c.Field === 'id');

        if (idColumn.Type.includes('varchar') || idColumn.Type.includes('char')) {
            log(`  ✓ intents.id type: ${idColumn.Type} (UUID-compatible)`, 'green');
        } else {
            log(`  ⚠️  intents.id type: ${idColumn.Type} (expected VARCHAR(36))`, 'yellow');
            log(`     Migration 20260205000002-fix-intents-id-to-uuid.js may not have run`, 'yellow');
        }

        // ==========================================
        // Check 4: Verify intent_listeners Columns
        // ==========================================
        log('\nCheck 4: Verifying intent_listeners table columns...', 'cyan');
        const [listenerColumns] = await sequelize.query("DESCRIBE intent_listeners");
        const listenerColumnNames = listenerColumns.map(c => c.Field);

        const requiredListenerColumns = [
            'id',
            'intentId',
            'listenerCode',
            'sequence',
            'handlerType',
            'handlerPath',
            'handlerConfig',
            'enabled',
            'executionMode'
        ];

        for (const col of requiredListenerColumns) {
            const exists = listenerColumnNames.includes(col);
            if (exists) {
                log(`  ✓ intent_listeners.${col}`, 'green');
            } else {
                log(`  ✗ intent_listeners.${col} - MISSING`, 'red');
                allChecksPassed = false;
            }
        }

        // ==========================================
        // Check 5: Verify feature_flags Columns
        // ==========================================
        log('\nCheck 5: Verifying feature_flags table columns...', 'cyan');
        const [flagColumns] = await sequelize.query("DESCRIBE feature_flags");
        const flagColumnNames = flagColumns.map(c => c.Field);

        const requiredFlagColumns = [
            'id',
            'flagName',
            'description',
            'enabled',
            'rolloutPercentage',
            'targetIntents',
            'targetUsers',
            'targetPlatforms',
            'environments'
        ];

        for (const col of requiredFlagColumns) {
            const exists = flagColumnNames.includes(col);
            if (exists) {
                log(`  ✓ feature_flags.${col}`, 'green');
            } else {
                log(`  ✗ feature_flags.${col} - MISSING`, 'red');
                allChecksPassed = false;
            }
        }

        // ==========================================
        // Check 6: Verify Indexes
        // ==========================================
        log('\nCheck 6: Verifying indexes...', 'cyan');

        // Check intent_classification_logs indexes
        const [classificationIndexes] = await sequelize.query(
            "SHOW INDEXES FROM intent_classification_logs"
        );
        const classificationIndexNames = [...new Set(classificationIndexes.map(i => i.Key_name))];
        log(`  ✓ intent_classification_logs: ${classificationIndexNames.length} indexes`, 'green');
        classificationIndexNames.forEach(name => {
            if (name !== 'PRIMARY') {
                log(`    - ${name}`, 'blue');
            }
        });

        // Check entity_collection_sessions indexes
        const [entityIndexes] = await sequelize.query(
            "SHOW INDEXES FROM entity_collection_sessions"
        );
        const entityIndexNames = [...new Set(entityIndexes.map(i => i.Key_name))];
        log(`  ✓ entity_collection_sessions: ${entityIndexNames.length} indexes`, 'green');
        entityIndexNames.forEach(name => {
            if (name !== 'PRIMARY') {
                log(`    - ${name}`, 'blue');
            }
        });

        // ==========================================
        // Check 7: Verify ENUM Values
        // ==========================================
        log('\nCheck 7: Verifying ENUM column values...', 'cyan');

        // Check llmProvider enum
        const llmProviderColumn = intentColumns.find(c => c.Field === 'llmProvider');
        if (llmProviderColumn && llmProviderColumn.Type.includes('enum')) {
            log(`  ✓ intents.llmProvider: ${llmProviderColumn.Type}`, 'green');
        } else {
            log(`  ⚠️  intents.llmProvider type unexpected: ${llmProviderColumn?.Type}`, 'yellow');
        }

        // Check responseType enum
        const responseTypeColumn = intentColumns.find(c => c.Field === 'responseType');
        if (responseTypeColumn && responseTypeColumn.Type.includes('enum')) {
            log(`  ✓ intents.responseType: ${responseTypeColumn.Type}`, 'green');
        } else {
            log(`  ⚠️  intents.responseType type unexpected: ${responseTypeColumn?.Type}`, 'yellow');
        }

        // Check handlerType enum
        const handlerTypeColumn = listenerColumns.find(c => c.Field === 'handlerType');
        if (handlerTypeColumn && handlerTypeColumn.Type.includes('enum')) {
            log(`  ✓ intent_listeners.handlerType: ${handlerTypeColumn.Type}`, 'green');
        } else {
            log(`  ⚠️  intent_listeners.handlerType type unexpected: ${handlerTypeColumn?.Type}`, 'yellow');
        }

        // ==========================================
        // Check 8: Verify SequelizeMeta Entries
        // ==========================================
        log('\nCheck 8: Verifying migration history...', 'cyan');
        const [executedMigrations] = await sequelize.query(
            'SELECT name FROM SequelizeMeta WHERE name LIKE "202601%" OR name LIKE "202602%" ORDER BY name'
        );

        const expectedMigrations = [
            '20260106000000-create-intent-listeners.js',
            '20260106000001-extend-intents-for-llm.js',
            '20260106000002-extend-intent-listeners.js',
            '20260106000003-create-feature-flags.js',
            '20260106000004-create-llm-provider-config.js',
            '20260106000005-create-intent-classification-logs.js',
            '20260106000006-create-entity-collection-sessions.js',
            '20260205000001-add-intent-response-config.js',
            '20260205000002-fix-intents-id-to-uuid.js'
        ];

        const executedNames = executedMigrations.map(m => m.name);

        for (const migration of expectedMigrations) {
            const exists = executedNames.includes(migration);
            if (exists) {
                log(`  ✓ ${migration}`, 'green');
            } else {
                log(`  ✗ ${migration} - NOT EXECUTED`, 'red');
                allChecksPassed = false;
            }
        }

        // ==========================================
        // Check 9: Data Validation
        // ==========================================
        log('\nCheck 9: Data validation...', 'cyan');

        // Count records in new tables
        const [intentListenerCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM intent_listeners'
        );
        log(`  ℹ  intent_listeners: ${intentListenerCount[0].count} records`, 'blue');

        const [featureFlagCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM feature_flags'
        );
        log(`  ℹ  feature_flags: ${featureFlagCount[0].count} records`, 'blue');

        const [llmConfigCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM llm_provider_config'
        );
        log(`  ℹ  llm_provider_config: ${llmConfigCount[0].count} records`, 'blue');

        const [classificationLogCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM intent_classification_logs'
        );
        log(`  ℹ  intent_classification_logs: ${classificationLogCount[0].count} records`, 'blue');

        const [entitySessionCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM entity_collection_sessions'
        );
        log(`  ℹ  entity_collection_sessions: ${entitySessionCount[0].count} records`, 'blue');

        // Check LLM-enabled intents
        const [llmIntentCount] = await sequelize.query(
            'SELECT COUNT(*) as count FROM intents WHERE llmEnabled = true'
        );
        log(`  ℹ  LLM-enabled intents: ${llmIntentCount[0].count}`, 'blue');

        // Sample UUID format verification
        const [sampleIntents] = await sequelize.query(
            'SELECT id, code FROM intents LIMIT 3'
        );
        log(`  Sample intent IDs:`, 'blue');
        sampleIntents.forEach(intent => {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent.id);
            log(`    ${intent.code}: ${intent.id} ${isUUID ? '(UUID ✓)' : '(NOT UUID ⚠️)'}`, isUUID ? 'green' : 'yellow');
        });

        // ==========================================
        // Summary
        // ==========================================
        log(`\n${'='.repeat(70)}`, 'cyan');
        log('VERIFICATION SUMMARY', 'bright');
        log(`${'='.repeat(70)}`, 'cyan');

        if (allChecksPassed) {
            log('\n✅ ALL CHECKS PASSED', 'green');
            log('\nThe database schema is correctly migrated for Dialogflow replacement.', 'green');
            log('You can proceed with running seeders and deploying the application.\n', 'green');
        } else {
            log('\n❌ SOME CHECKS FAILED', 'red');
            log('\nPlease review the errors above and ensure all migrations have been run.', 'red');
            log('You may need to run: npx sequelize-cli db:migrate\n', 'yellow');
        }

        log(`${'='.repeat(70)}\n`, 'cyan');

        await sequelize.close();
        process.exit(allChecksPassed ? 0 : 1);

    } catch (error) {
        log(`\n❌ Verification error: ${error.message}`, 'red');
        log(error.stack, 'red');
        await sequelize.close();
        process.exit(1);
    }
}

// Main execution
(async () => {
    await verifyMigrations();
})();
