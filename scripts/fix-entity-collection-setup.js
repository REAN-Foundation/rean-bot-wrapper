const { Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const config = require('../src/data/database/sequelize/database.config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function fixSetup() {
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('Connected to database\n');

        // 1. Check if the correct flag exists
        const [existingFlags] = await sequelize.query(
            `SELECT id FROM feature_flags WHERE flagName = 'entityCollection_blood_glucose_create'`
        );

        if (existingFlags.length === 0) {
            console.log('Adding missing feature flag: entityCollection_blood_glucose_create');
            await sequelize.query(`
                INSERT INTO feature_flags (id, flagName, description, enabled, rolloutPercentage, targetIntents, environments, createdAt, updatedAt)
                VALUES (
                    '${uuidv4()}',
                    'entityCollection_blood_glucose_create',
                    'Enable entity collection for blood glucose intent',
                    1,
                    100,
                    '["blood.glucose.create"]',
                    '["development", "staging", "production"]',
                    NOW(),
                    NOW()
                )
            `);
            console.log('Flag added and ENABLED!\n');
        } else {
            // Enable it if it exists but is disabled
            await sequelize.query(`
                UPDATE feature_flags
                SET enabled = 1, rolloutPercentage = 100
                WHERE flagName = 'entityCollection_blood_glucose_create'
            `);
            console.log('Flag entityCollection_blood_glucose_create is now ENABLED!\n');
        }

        // 2. Check entity schema - show the entity names
        const [intents] = await sequelize.query(
            `SELECT entitySchema FROM intents WHERE Code = 'blood.glucose.create'`
        );

        if (intents.length > 0 && intents[0].entitySchema) {
            const schema = typeof intents[0].entitySchema === 'string'
                ? JSON.parse(intents[0].entitySchema)
                : intents[0].entitySchema;
            console.log('Current entity schema entity names:', Object.keys(schema));
            console.log('\nFull schema:');
            console.log(JSON.stringify(schema, null, 2));
        }

        // 3. Verify all flags
        console.log('\n=== Final Flag Status ===');
        const [flags] = await sequelize.query(`
            SELECT flagName, enabled, rolloutPercentage
            FROM feature_flags
            WHERE flagName LIKE '%EntityCollection%' OR flagName LIKE '%entity%collection%' OR flagName LIKE '%Classification%'
        `);
        flags.forEach(function(f) {
            console.log('  ' + f.flagName + ': ' + (f.enabled ? 'ENABLED' : 'DISABLED') + ' (' + f.rolloutPercentage + '%)');
        });

        await sequelize.close();
        console.log('\nDone! Try sending "I want to log my blood glucose" again.');
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    }
}

fixSetup();
