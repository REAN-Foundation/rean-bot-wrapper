module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.createTable('entity_collection_sessions', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false
                },
                intentId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'intents',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                userPlatformId: {
                    type: Sequelize.STRING(255),
                    allowNull: false
                },
                sessionId: {
                    type: Sequelize.STRING(255),
                    allowNull: false
                },
                status: {
                    type: Sequelize.ENUM('active', 'completed', 'abandoned', 'timeout'),
                    allowNull: false
                },
                currentTurn: {
                    type: Sequelize.INTEGER,
                    defaultValue: 1,
                    allowNull: false
                },
                maxTurns: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                requiredEntities: {
                    type: Sequelize.JSON,
                    allowNull: false
                },
                collectedEntities: {
                    type: Sequelize.JSON,
                    allowNull: false
                },
                conversationHistory: {
                    type: Sequelize.JSON,
                    allowNull: false
                },
                startedAt: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                lastActivityAt: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                timeoutAt: {
                    type: Sequelize.DATE,
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
            }, { transaction: t }).then(() => {
                // Add indexes
                return Promise.all([
                    queryInterface.addIndex('entity_collection_sessions', ['userPlatformId'], {
                        name: 'idx_entity_sessions_user_platform_id',
                        transaction: t
                    }),
                    queryInterface.addIndex('entity_collection_sessions', ['sessionId'], {
                        name: 'idx_entity_sessions_session_id',
                        transaction: t
                    }),
                    queryInterface.addIndex('entity_collection_sessions', ['status'], {
                        name: 'idx_entity_sessions_status',
                        transaction: t
                    })
                ]);
            });
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.dropTable('entity_collection_sessions', { transaction: t });
        });
    }
};
