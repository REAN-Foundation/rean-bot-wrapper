module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.addColumn('contact_list', 'ehrSystemCode', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.addColumn('contact_list', 'patientUserId', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.addColumn('contact_list', 'cmrChatTaskID', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.addColumn('contact_list', 'cmrCaseTaskID', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t })
            ]);
        });
    },
    down : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('contact_list', 'ehrSystemCode', { transaction: t }),
                queryInterface.removeColumn('contact_list', 'patientUserId', { transaction: t }),
                queryInterface.removeColumn('contact_list', 'cmrChatTaskID', { transaction: t }),
                queryInterface.removeColumn('contact_list', 'cmrCaseTaskID', { transaction: t }),
                
            ]);
        });
    }
};

