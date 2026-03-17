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
        await sequelize.authenticate();
        console.log('Connected to database');

        const [results] = await sequelize.query('DESCRIBE intents');
        console.log('\nIntents table schema:');
        results.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key || ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
        });

        // Check if there are any existing records
        const [count] = await sequelize.query('SELECT COUNT(*) as count FROM intents');
        console.log(`\nExisting intent records: ${count[0].count}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sequelize.close();
    }
})();
