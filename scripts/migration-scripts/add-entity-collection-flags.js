/**
 * Script to add entity collection feature flags
 *
 * Adds the missing entity collection flags that weren't in the original seeder
 */

const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const config = require('../src/data/database/sequelize/database.config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false
});

(async () => {
    try {
        console.log('Adding entity collection feature flags...\n');

        const now = new Date();

        // Check if flags already exist
        const [existingFlags] = await sequelize.query(
            "SELECT flagName FROM feature_flags WHERE flagName IN ('llmEntityCollectionEnabled', 'entityCollection_keratoplasty_symptom_analysis')"
        );

        const existingFlagNames = existingFlags.map(f => f.flagName);

        // Add master entity collection flag if not exists
        if (!existingFlagNames.includes('llmEntityCollectionEnabled')) {
            await sequelize.query(
                `INSERT INTO feature_flags
                (id, flagName, description, enabled, rolloutPercentage, targetIntents, targetUsers, targetPlatforms, environments, expiresAt, createdAt, updatedAt)
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        uuidv4(),
                        'llmEntityCollectionEnabled',
                        'Master flag: Enable LLM-based multi-turn entity collection',
                        false,
                        0,
                        null,
                        null,
                        null,
                        JSON.stringify(['development', 'staging']),
                        null,
                        now,
                        now
                    ]
                }
            );
            console.log('✓ Added: llmEntityCollectionEnabled');
        } else {
            console.log('⊙ Already exists: llmEntityCollectionEnabled');
        }

        // Add keratoplasty entity collection flag if not exists
        if (!existingFlagNames.includes('entityCollection_keratoplasty_symptom_analysis')) {
            await sequelize.query(
                `INSERT INTO feature_flags
                (id, flagName, description, enabled, rolloutPercentage, targetIntents, targetUsers, targetPlatforms, environments, expiresAt, createdAt, updatedAt)
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        uuidv4(),
                        'entityCollection_keratoplasty_symptom_analysis',
                        'Enable entity collection for keratoplasty symptom analysis (collects symptoms)',
                        false,
                        0,
                        JSON.stringify(['keratoplasty.symptom.analysis']),
                        null,
                        null,
                        JSON.stringify(['development', 'staging']),
                        null,
                        now,
                        now
                    ]
                }
            );
            console.log('✓ Added: entityCollection_keratoplasty_symptom_analysis');
        } else {
            console.log('⊙ Already exists: entityCollection_keratoplasty_symptom_analysis');
        }

        console.log('\n✅ Entity collection flags setup complete!');
        console.log('\nTo enable the keratoplasty flow, run:');
        console.log('  node scripts/enable-keratoplasty-flow.js');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
})();
