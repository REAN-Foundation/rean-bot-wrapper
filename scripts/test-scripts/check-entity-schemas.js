const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');

const sequelize = new Sequelize(config.development);

async function checkIntents() {
    try {
        const [results] = await sequelize.query(`
            SELECT
                code,
                name,
                responseType,
                llmEnabled,
                active,
                entitySchema
            FROM intents
            WHERE code IN (
                'conditionIdentification',
                'MoreSymptoms',
                'KerotoplastyFollowUp',
                'eyeImage',
                'responseYes',
                'responseNo'
            )
            ORDER BY
                CASE code
                    WHEN 'conditionIdentification' THEN 1
                    WHEN 'MoreSymptoms' THEN 2
                    WHEN 'KerotoplastyFollowUp' THEN 3
                    WHEN 'eyeImage' THEN 4
                    WHEN 'responseYes' THEN 5
                    WHEN 'responseNo' THEN 6
                END
        `);

        console.log('\n=== DIALOGFLOW SYMPTOM FLOW INTENTS ===\n');

        results.forEach(intent => {
            console.log(`\n📌 ${intent.code}`);
            console.log(`   Name: ${intent.name}`);
            console.log(`   Response Type: ${intent.responseType}`);
            console.log(`   LLM Enabled: ${intent.llmEnabled}`);
            console.log(`   Active: ${intent.active}`);
            console.log(`   Entity Schema:`);

            if (intent.entitySchema) {
                try {
                    // Handle if entitySchema is a Buffer or object
                    let schemaString = intent.entitySchema;
                    if (Buffer.isBuffer(schemaString)) {
                        schemaString = schemaString.toString('utf8');
                    } else if (typeof schemaString === 'object') {
                        schemaString = JSON.stringify(schemaString);
                    }

                    const schema = JSON.parse(schemaString);
                    Object.keys(schema).forEach(entityName => {
                        console.log(`      - ${entityName}:`);
                        console.log(`          type: ${schema[entityName].type}`);
                        console.log(`          required: ${schema[entityName].required}`);
                        if (schema[entityName].followUpQuestion) {
                            console.log(`          followUpQuestion: "${schema[entityName].followUpQuestion.substring(0, 60)}..."`);
                        }
                    });
                } catch (error) {
                    console.log(`      ⚠️  Error parsing schema: ${error.message}`);
                    console.log(`      Raw type: ${typeof intent.entitySchema}`);
                }
            } else {
                console.log(`      (No entities)`);
            }
        });

        console.log('\n✅ All intents verified!\n');
        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkIntents();
