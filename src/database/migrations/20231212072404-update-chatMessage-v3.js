module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.addColumn('chat_message', 'messageFlag', {
                    type : Sequelize.DataTypes.STRING,
                }, {transaction: t}),
            ]);
        });
    },

    down : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('chat_message', 'messageFlag', {transaction: t}),
            ]);
        });
    }
};
