/**
 * Script to verify seed data was inserted correctly
 */

const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        port: dbConfig.port,
        logging: false // Suppress SQL logging for cleaner output
    }
);

async function verifySeedData() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check Feature Flags
        console.log('📋 Feature Flags:');
        console.log('─'.repeat(80));
        const [flags] = await sequelize.query(
            'SELECT flagName, enabled, rolloutPercentage FROM feature_flags ORDER BY flagName'
        );

        if (flags.length === 0) {
            console.log('  ❌ No feature flags found!');
        } else {
            flags.forEach(flag => {
                const status = flag.enabled ? '✅ Enabled' : '❌ Disabled';
                console.log(`  ${status} | ${flag.flagName.padEnd(35)} | Rollout: ${flag.rolloutPercentage}%`);
            });
            console.log(`\n  Total: ${flags.length} feature flags\n`);
        }

        // Check LLM Providers
        console.log('🤖 LLM Provider Configurations:');
        console.log('─'.repeat(80));
        const [providers] = await sequelize.query(
            'SELECT providerName, modelName, enabled, priority, costPer1kTokens FROM llm_provider_config ORDER BY priority'
        );

        if (providers.length === 0) {
            console.log('  ❌ No LLM providers found!');
        } else {
            providers.forEach(provider => {
                const status = provider.enabled ? '✅ Enabled' : '❌ Disabled';
                const cost = `$${provider.costPer1kTokens.toFixed(5)}`;
                console.log(`  ${status} | Priority ${provider.priority} | ${provider.providerName}/${provider.modelName.padEnd(20)} | ${cost}/1k tokens`);
            });
            console.log(`\n  Total: ${providers.length} LLM providers\n`);
        }

        // Check all tables
        console.log('📊 All Phase 1 Tables:');
        console.log('─'.repeat(80));
        const [tables] = await sequelize.query('SHOW TABLES');
        const phase1Tables = ['intents', 'intent_listeners', 'feature_flags', 'llm_provider_config', 'intent_classification_logs', 'entity_collection_sessions'];

        phase1Tables.forEach(tableName => {
            const exists = tables.some(table => Object.values(table)[0] === tableName);
            const status = exists ? '✅' : '❌';
            console.log(`  ${status} ${tableName}`);
        });

        console.log('\n🎉 Phase 1 Database Setup Complete!\n');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await sequelize.close();
        process.exit(1);
    }
}

verifySeedData();
