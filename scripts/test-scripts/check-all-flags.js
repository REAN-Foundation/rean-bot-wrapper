const { Sequelize } = require('sequelize');
const config = require('../src/data/database/sequelize/database.config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function checkFlags() {
    const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: false
    });

    try {
        const [flags] = await sequelize.query(`SELECT flagName, enabled FROM feature_flags`);
        console.log('All feature flags:');
        flags.forEach(function(f) {
            console.log('  ' + f.flagName + ': ' + (f.enabled ? 'ENABLED' : 'DISABLED'));
        });
        await sequelize.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkFlags();
