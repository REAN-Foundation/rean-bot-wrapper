const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function fixEntitySchema() {
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('Connected to database\n');

        // New entity schema matching the LLM listener expectations
        const newEntitySchema = {
            "BloodGlucose_Amount": {
                "type": "number",
                "required": true,
                "description": "The blood glucose reading value in mg/dL",
                "validation": {
                    "min": 20,
                    "max": 600
                },
                "examples": ["120", "85", "150", "200"],
                "followUpQuestion": "What is your blood glucose reading?"
            },
            "BloodGlucose_unit": {
                "type": "enum",
                "required": false,
                "description": "The unit of measurement for blood glucose",
                "validation": {
                    "allowedValues": ["mg/dL", "mmol/L"]
                },
                "examples": ["mg/dL", "mmol/L"],
                "followUpQuestion": "What unit is your reading in? (mg/dL or mmol/L)"
            }
        };

        console.log('Updating entity schema for blood.glucose.create...');
        console.log('New schema:', JSON.stringify(newEntitySchema, null, 2));

        await sequelize.query(`
            UPDATE intents
            SET entitySchema = :schema
            WHERE Code = 'blood.glucose.create'
        `, {
            replacements: { schema: JSON.stringify(newEntitySchema) }
        });

        console.log('\nEntity schema updated successfully!');

        // Verify the update
        const [result] = await sequelize.query(
            `SELECT entitySchema FROM intents WHERE Code = 'blood.glucose.create'`
        );

        if (result.length > 0) {
            const schema = typeof result[0].entitySchema === 'string'
                ? JSON.parse(result[0].entitySchema)
                : result[0].entitySchema;
            console.log('\nVerified entity names:', Object.keys(schema));
        }

        await sequelize.close();
        console.log('\nDone! Entity collection should now work correctly.');
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    }
}

fixEntitySchema();
