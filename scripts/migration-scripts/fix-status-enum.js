const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function fixStatusEnum() {
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: console.log
    });

    try {
        await sequelize.authenticate();
        console.log('Connected to database\n');

        console.log('Altering status ENUM to include all valid states...');

        // MySQL requires dropping and recreating ENUM or modifying the column
        await sequelize.query(`
            ALTER TABLE entity_collection_sessions
            MODIFY COLUMN status ENUM('initialized', 'collecting', 'validating', 'completed', 'abandoned', 'timeout', 'error') NOT NULL
        `);

        console.log('\nStatus ENUM updated successfully!');
        console.log('Valid values now: initialized, collecting, validating, completed, abandoned, timeout, error');

        await sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
        if (error.message.includes('Unknown column')) {
            console.log('\nNote: If the table was just created with the old enum, you may need to recreate it.');
        }
    }
}

fixStatusEnum();
