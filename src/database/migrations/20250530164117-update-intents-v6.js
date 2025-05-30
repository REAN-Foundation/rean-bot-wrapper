module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                // queryInterface.renameColumn('intents', 'autoIncrementalId', 'id', { transaction: t }),
                queryInterface.changeColumn('intents', 'id', {
                    type         : Sequelize.UUID,
                    allowNull    : false,
                    defaultValue : Sequelize.UUIDV4
                }, { transaction: t })
            ]);
        });
    },
    down : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.changeColumn('intents', 'id', {
                    type          : Sequelize.DataTypes.DATE,
                    allowNull     : false,
                    autoIncrement : true

                }, { transaction: t }),
                // queryInterface.renameColumn('intents', 'id', 'autoIncrementalId', { transaction: t })
            ]);
        });
    }
};
