const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function addIntentCodeColumn() {
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: console.log
    });

    try {
        await sequelize.authenticate();
        console.log('Connected to database\n');

        // Check if column exists
        const [columns] = await sequelize.query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${dbConfig.database}'
            AND TABLE_NAME = 'entity_collection_sessions'
            AND COLUMN_NAME = 'intentCode'
        `);

        if (columns.length === 0) {
            console.log('Adding intentCode column...');
            await sequelize.query(`
                ALTER TABLE entity_collection_sessions
                ADD COLUMN intentCode VARCHAR(255) NOT NULL DEFAULT '' AFTER sessionId
            `);
            console.log('Column added successfully!');
        } else {
            console.log('intentCode column already exists.');
        }

        // Clear any existing sessions that don't have intentCode (they'll be stale anyway)
        await sequelize.query(`
            DELETE FROM entity_collection_sessions WHERE intentCode = '' OR intentCode IS NULL
        `);
        console.log('Cleared stale sessions without intentCode.');

        await sequelize.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

addIntentCodeColumn();
