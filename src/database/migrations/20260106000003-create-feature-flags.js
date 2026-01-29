module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.createTable('feature_flags', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.UUIDV4,
                    primaryKey: true,
                    allowNull: false
                },
                flagName: {
                    type: Sequelize.STRING(128),
                    allowNull: false,
                    unique: true
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                enabled: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                },
                rolloutPercentage: {
                    type: Sequelize.INTEGER,
                    defaultValue: 0,
                    allowNull: false
                },
                targetIntents: {
                    type: Sequelize.JSON,
                    allowNull: true
                },
                targetUsers: {
                    type: Sequelize.JSON,
                    allowNull: true
                },
                targetPlatforms: {
                    type: Sequelize.JSON,
                    allowNull: true
                },
                environments: {
                    type: Sequelize.JSON,
                    allowNull: true
                },
                expiresAt: {
                    type: Sequelize.DATE,
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
            }, { transaction: t });
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return queryInterface.dropTable('feature_flags', { transaction: t });
        });
    }
};
