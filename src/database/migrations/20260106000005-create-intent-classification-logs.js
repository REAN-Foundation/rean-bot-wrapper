module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.createTable('intent_classification_logs', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false
                },
                intentId: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'intents',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL'
                },
                userPlatformId: {
                    type: Sequelize.STRING(255),
                    allowNull: false
                },
                userMessage: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },
                detectedLanguage: {
                    type: Sequelize.STRING(10),
                    allowNull: true
                },
                llmProvider: {
                    type: Sequelize.STRING(50),
                    allowNull: true
                },
                llmModel: {
                    type: Sequelize.STRING(100),
                    allowNull: true
                },
                classifiedIntent: {
                    type: Sequelize.STRING(128),
                    allowNull: true
                },
                confidenceScore: {
                    type: Sequelize.FLOAT,
                    allowNull: true
                },
                classificationMethod: {
                    type: Sequelize.ENUM('llm', 'dialogflow', 'button'),
                    allowNull: false
                },
                fallbackTriggered: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                },
                dialogflowResult: {
                    type: Sequelize.JSON,
                    allowNull: true
                },
                processingTimeMs: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                tokenUsage: {
                    type: Sequelize.JSON,
                    allowNull: true
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
            }, { transaction: t }).then(() => {
                // Add indexes
                return Promise.all([
                    queryInterface.addIndex('intent_classification_logs', ['userPlatformId'], {
                        name: 'idx_classification_logs_user_platform_id',
                        transaction: t
                    }),
                    queryInterface.addIndex('intent_classification_logs', ['intentId'], {
                        name: 'idx_classification_logs_intent_id',
                        transaction: t
                    }),
                    queryInterface.addIndex('intent_classification_logs', ['classificationMethod'], {
                        name: 'idx_classification_logs_method',
                        transaction: t
                    }),
                    queryInterface.addIndex('intent_classification_logs', ['createdAt'], {
                        name: 'idx_classification_logs_created_at',
                        transaction: t
                    })
                ]);
            });
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.dropTable('intent_classification_logs', { transaction: t });
        });
    }
};
