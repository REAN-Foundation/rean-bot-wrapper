/**
 * Script to check database state and run migrations safely
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('../src/data/database/sequelize/database.config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        port: dbConfig.port,
        logging: console.log
    }
);

async function checkDatabaseState() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Get all table names
        const [tables] = await sequelize.query(
            "SHOW TABLES"
        );

        console.log('\n📋 Existing tables:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });

        // Check if intents table exists
        const intentsExists = tables.some(table =>
            Object.values(table)[0] === 'intents'
        );

        if (intentsExists) {
            // Check columns in intents table
            const [columns] = await sequelize.query(
                "DESCRIBE intents"
            );

            console.log('\n📊 Intents table columns:');
            columns.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`);
            });

            // Check if our new columns exist
            const hasLLMColumns = columns.some(col => col.Field === 'llmEnabled');

            if (hasLLMColumns) {
                console.log('\n✅ Phase 1 migrations already applied!');
            } else {
                console.log('\n⚠️  Phase 1 migrations need to be applied.');
            }
        }

        // Check if intent_listeners table exists
        const listenersExists = tables.some(table =>
            Object.values(table)[0] === 'intent_listeners'
        );

        if (!listenersExists) {
            console.log('\n⚠️  intent_listeners table does not exist. Need to create it first.');
        }

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await sequelize.close();
        process.exit(1);
    }
}

checkDatabaseState();
