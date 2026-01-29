/**
 * Script to safely apply Phase 1 migrations
 * Marks old migrations as complete and runs only Phase 1 migrations
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
        logging: console.log
    }
);

// Old migrations that have schema already applied
const oldMigrations = [
    '20230414124431-update-chatMessage-v1.js',
    '20230419120149-update-chatMessage-v2.js',
    '20231212072404-update-chatMessage-v3.js',
    '20240529120624-update-contactList-v4.js',
    '20240823120149-update-contactList-v5.js',
    '20250530164117-update-intents-v6.js'
];

async function markOldMigrationsComplete() {
    try {
        console.log('🔍 Checking SequelizeMeta table...\n');

        // Check existing migrations
        const [existingMigrations] = await sequelize.query(
            'SELECT name FROM sequelizemeta'
        );

        console.log('Current migrations in SequelizeMeta:');
        existingMigrations.forEach(m => console.log(`  - ${m.name}`));

        console.log('\n📝 Marking old migrations as complete...\n');

        for (const migration of oldMigrations) {
            // Check if already exists
            const exists = existingMigrations.some(m => m.name === migration);

            if (!exists) {
                await sequelize.query(
                    'INSERT INTO sequelizemeta (name) VALUES (?)',
                    {
                        replacements: [migration]
                    }
                );
                console.log(`  ✅ Marked ${migration} as complete`);
            } else {
                console.log(`  ⏭️  ${migration} already marked as complete`);
            }
        }

        console.log('\n✅ All old migrations marked as complete!');
        console.log('\n💡 Now you can run: npx sequelize-cli db:migrate');
        console.log('   This will apply only the Phase 1 migrations.\n');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await sequelize.close();
        process.exit(1);
    }
}

markOldMigrationsComplete();
