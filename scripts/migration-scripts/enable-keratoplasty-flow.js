/**
 * Script to enable keratoplasty flow with entity collection
 *
 * This enables:
 * 1. Master LLM intent response flag
 * 2. Master entity collection flag
 * 3. Keratoplasty flow flag
 * 4. Keratoplasty entity collection flag
 */

const { Sequelize } = require('sequelize');
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
        console.log('Enabling keratoplasty flow with entity collection...\n');

        // Enable master flags
        await sequelize.query(
            "UPDATE feature_flags SET enabled = true WHERE flagName = 'llmIntentResponseEnabled'"
        );
        console.log('✓ Enabled: llmIntentResponseEnabled');

        await sequelize.query(
            "UPDATE feature_flags SET enabled = true WHERE flagName = 'llmEntityCollectionEnabled'"
        );
        console.log('✓ Enabled: llmEntityCollectionEnabled');

        // Enable keratoplasty flow
        await sequelize.query(
            "UPDATE feature_flags SET enabled = true WHERE flagName = 'llmIntent_keratoplasty_flow'"
        );
        console.log('✓ Enabled: llmIntent_keratoplasty_flow');

        // Enable entity collection for keratoplasty symptom analysis
        await sequelize.query(
            "UPDATE feature_flags SET enabled = true WHERE flagName = 'entityCollection_keratoplasty_symptom_analysis'"
        );
        console.log('✓ Enabled: entityCollection_keratoplasty_symptom_analysis');

        // Enable static intents for testing
        await sequelize.query(
            "UPDATE feature_flags SET enabled = true WHERE flagName = 'llmIntent_default_welcome'"
        );
        console.log('✓ Enabled: llmIntent_default_welcome');

        console.log('\n✅ Keratoplasty flow enabled successfully!');
        console.log('\nTest flow:');
        console.log('1. Send "Hello" → Should show welcome with buttons');
        console.log('2. Click "Report Symptoms" → Should ask for symptoms');
        console.log('3. Type "redness and pain" → Should collect symptoms and classify severity');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
})();
