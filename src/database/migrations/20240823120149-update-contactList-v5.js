module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.addColumn('contact_list', 'repetitionFlag', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t })
            ]);
        });
    },
    down : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('contact_list', 'repetitionFlag', { transaction: t })
                
            ]);
        });
    }
};