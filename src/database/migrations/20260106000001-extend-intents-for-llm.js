module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                // LLM Configuration
                queryInterface.addColumn('intents', 'llmEnabled', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                }, { transaction: t }),

                queryInterface.addColumn('intents', 'llmProvider', {
                    type: Sequelize.ENUM('dialogflow', 'openai', 'claude'),
                    defaultValue: 'dialogflow',
                    allowNull: false
                }, { transaction: t }),

                queryInterface.addColumn('intents', 'intentDescription', {
                    type: Sequelize.TEXT,
                    allowNull: true
                }, { transaction: t }),

                queryInterface.addColumn('intents', 'intentExamples', {
                    type: Sequelize.JSON,
                    allowNull: true,
                    comment: 'Array of example phrases for LLM training'
                }, { transaction: t }),

                // Entity Configuration
                queryInterface.addColumn('intents', 'entitySchema', {
                    type: Sequelize.JSON,
                    allowNull: true,
                    comment: 'Schema defining required entities: {entityName: {type, required, description, validation}}'
                }, { transaction: t }),

                // Conversation Configuration
                queryInterface.addColumn('intents', 'conversationConfig', {
                    type: Sequelize.JSON,
                    allowNull: true,
                    comment: 'Configuration for multi-turn conversations: {maxTurns, timeoutMinutes, followUpStrategy}'
                }, { transaction: t }),

                // Classification Settings
                queryInterface.addColumn('intents', 'confidenceThreshold', {
                    type: Sequelize.FLOAT,
                    defaultValue: 0.75,
                    allowNull: false
                }, { transaction: t }),

                queryInterface.addColumn('intents', 'fallbackToDialogflow', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                }, { transaction: t }),

                queryInterface.addColumn('intents', 'priority', {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false,
                    comment: 'Higher priority intents are checked first'
                }, { transaction: t }),

                queryInterface.addColumn('intents', 'active', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                }, { transaction: t })
            ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('intents', 'llmEnabled', { transaction: t }),
                queryInterface.removeColumn('intents', 'llmProvider', { transaction: t }),
                queryInterface.removeColumn('intents', 'intentDescription', { transaction: t }),
                queryInterface.removeColumn('intents', 'intentExamples', { transaction: t }),
                queryInterface.removeColumn('intents', 'entitySchema', { transaction: t }),
                queryInterface.removeColumn('intents', 'conversationConfig', { transaction: t }),
                queryInterface.removeColumn('intents', 'confidenceThreshold', { transaction: t }),
                queryInterface.removeColumn('intents', 'fallbackToDialogflow', { transaction: t }),
                queryInterface.removeColumn('intents', 'priority', { transaction: t }),
                queryInterface.removeColumn('intents', 'active', { transaction: t })
            ]);
        });
    }
};
