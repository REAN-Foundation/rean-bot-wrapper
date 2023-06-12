module.exports = {
    up : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.addColumn('chat_message', 'supportchannelName', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.addColumn('chat_message', 'supportChannelTaskID', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.addColumn('chat_message', 'humanHandoff', {
                    type : Sequelize.DataTypes.BOOLEAN,
                }, { transaction: t }),
                queryInterface.addColumn('chat_message', 'feedbackType', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.addColumn('chat_message', 'responseMessageID', {
                    type : Sequelize.DataTypes.STRING,
                }, { transaction: t }),
                queryInterface.removeColumn('chat_message', 'telegramResponseMessageId'),
                queryInterface.removeColumn('chat_message', 'whatsappResponseMessageId')
            ]);
        });
    },
    down : (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('chat_message', 'supportchannelName', { transaction: t }),
                queryInterface.removeColumn('chat_message', 'supportChannelTaskID', { transaction: t }),
                queryInterface.removeColumn('chat_message', 'humanHandoff', { transaction: t }),
                queryInterface.removeColumn('chat_message', 'feedbackType', { transaction: t }),
                queryInterface.removeColumn('chat_message', 'responseMessageId', { transaction: t }),
                queryInterface.addColumn('chat_message', 'telegramResponseMessageId', {
                    type      : Sequelize.STRING(1024),
                    allowNull : true
                }),
                queryInterface.addColumn('chat_message', 'whatsappResponseMessageId', {
                    type      : Sequelize.STRING(1024),
                    allowNull : true
                })
            ]);
        });
    }
};
