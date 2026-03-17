/**
 * Check if LLM infrastructure tables exist in the database
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sushant_local', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false
});

async function checkTables() {
    console.log('\n========================================');
    console.log('🗄️  Database Table Verification');
    console.log('========================================\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check for LLM tables
        const expectedTables = [
            'feature_flags',
            'llm_provider_config',
            'intent_classification_logs',
            'entity_collection_sessions',
            'intents',
            'intent_listeners'
        ];

        console.log('Checking tables...\n');

        const [results] = await sequelize.query('SHOW TABLES');
        const existingTables = results.map(r => Object.values(r)[0]);

        for (const table of expectedTables) {
            const exists = existingTables.includes(table);
            const icon = exists ? '✅' : '❌';
            console.log(`${icon} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
        }

        // Check feature_flags data
        console.log('\n--- Feature Flags Data ---');
        try {
            const [flags] = await sequelize.query('SELECT flagName, enabled, rolloutPercentage FROM feature_flags LIMIT 10');
            if (flags.length > 0) {
                console.log(`✅ Found ${flags.length} feature flags:`);
                flags.forEach(f => console.log(`   - ${f.flagName}: enabled=${f.enabled}, rollout=${f.rolloutPercentage}%`));
            } else {
                console.log('⚠️  No feature flags found - run seeders');
            }
        } catch (e) {
            console.log('❌ Could not query feature_flags:', e.message);
        }

        // Check llm_provider_config data
        console.log('\n--- LLM Provider Config Data ---');
        try {
            const [providers] = await sequelize.query('SELECT providerName, enabled, isDefault FROM llm_provider_config LIMIT 10');
            if (providers.length > 0) {
                console.log(`✅ Found ${providers.length} LLM providers:`);
                providers.forEach(p => console.log(`   - ${p.providerName}: enabled=${p.enabled}, default=${p.isDefault}`));
            } else {
                console.log('⚠️  No LLM providers found - run seeders');
            }
        } catch (e) {
            console.log('❌ Could not query llm_provider_config:', e.message);
        }

        // Check intents table for LLM fields
        console.log('\n--- Intents Table Structure ---');
        try {
            const [columns] = await sequelize.query("SHOW COLUMNS FROM intents WHERE Field LIKE 'll%' OR Field LIKE 'intent%' OR Field LIKE 'entity%' OR Field LIKE 'confidence%' OR Field LIKE 'fallback%'");
            if (columns.length > 0) {
                console.log(`✅ Found ${columns.length} LLM-related columns in intents table:`);
                columns.forEach(c => console.log(`   - ${c.Field}: ${c.Type}`));
            } else {
                console.log('⚠️  No LLM columns found in intents table');
            }
        } catch (e) {
            console.log('❌ Could not check intents columns:', e.message);
        }

        // Check intent_listeners table structure
        console.log('\n--- Intent Listeners Table Structure ---');
        try {
            const [columns] = await sequelize.query("SHOW COLUMNS FROM intent_listeners");
            console.log(`✅ Found ${columns.length} columns in intent_listeners table`);
        } catch (e) {
            console.log('❌ Could not check intent_listeners:', e.message);
        }

        console.log('\n========================================');
        console.log('✅ Database verification complete');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkTables();
