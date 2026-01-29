module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.createTable('llm_provider_config', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false
                },
                providerName: {
                    type: Sequelize.STRING(100),
                    allowNull: false
                },
                modelName: {
                    type: Sequelize.STRING(100),
                    allowNull: false
                },
                apiConfig: {
                    type: Sequelize.JSON,
                    allowNull: false
                },
                supportsIntentClassification: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                },
                supportsEntityExtraction: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                },
                supportsMultilingual: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                },
                maxTokens: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                temperature: {
                    type: Sequelize.FLOAT,
                    allowNull: false
                },
                timeoutMs: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                costPer1kTokens: {
                    type: Sequelize.FLOAT,
                    allowNull: false
                },
                enabled: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                },
                priority: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            }, { transaction: t });
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.dropTable('llm_provider_config', { transaction: t });
        });
    }
};
