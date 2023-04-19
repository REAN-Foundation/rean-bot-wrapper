module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.addColumn('chat_message', 'whatsappResponseStatusReadTimestamp', {
                    type : Sequelize.DataTypes.DATE,
                }, { transaction: t })
            ]);
        });
    },
    down : (queryInterface) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('chat_message', 'whatsappResponseStatusReadTimestamp', { transaction: t })
            ]);
        });
    }
};
