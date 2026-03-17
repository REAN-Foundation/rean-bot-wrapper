const { Sequelize } = require('sequelize');

// Get database config
const config = require('../src/data/database/sequelize/database.config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function checkIntentConfig() {
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('Connected to database\n');

        // Check blood.glucose.create intent
        const [intents] = await sequelize.query(`
            SELECT id, Name, Code, llmEnabled, entitySchema, conversationConfig, confidenceThreshold
            FROM intents 
            WHERE Code = 'blood.glucose.create' OR Code LIKE '%blood%glucose%'
            LIMIT 5
        `);
        
        console.log('=== Blood Glucose Intent ===');
        if (intents.length === 0) {
            console.log('No blood glucose intent found in database!');
        } else {
            intents.forEach(intent => {
                console.log('ID:', intent.id);
                console.log('Name:', intent.Name);
                console.log('Code:', intent.Code);
                console.log('llmEnabled:', intent.llmEnabled);
                console.log('entitySchema:', intent.entitySchema);
                console.log('conversationConfig:', intent.conversationConfig);
                console.log('confidenceThreshold:', intent.confidenceThreshold);
                console.log('---');
            });
        }

        // Check feature flags
        const [flags] = await sequelize.query(`
            SELECT flagName, enabled, rolloutPercentage, targetIntents
            FROM feature_flags 
            WHERE flagName IN ('llmEntityCollectionEnabled', 'entityCollection_blood_glucose_create', 'llmClassificationEnabled')
        `);
        
        console.log('\n=== Feature Flags ===');
        if (flags.length === 0) {
            console.log('No relevant feature flags found!');
        } else {
            flags.forEach(flag => {
                console.log(`${flag.flagName}: enabled=${flag.enabled}, rollout=${flag.rolloutPercentage}%`);
            });
        }

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkIntentConfig();
