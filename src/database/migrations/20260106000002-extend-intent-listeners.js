module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                // Handler type classification
                queryInterface.addColumn('intent_listeners', 'handlerType', {
                    type: Sequelize.ENUM('function', 'class', 'service'),
                    defaultValue: 'function',
                    allowNull: false
                }, { transaction: t }),

                // Handler path for dynamic discovery
                queryInterface.addColumn('intent_listeners', 'handlerPath', {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    comment: 'Path to handler function/class/service (e.g., bloodWarrior.welcome.listener)'
                }, { transaction: t }),

                // Handler configuration
                queryInterface.addColumn('intent_listeners', 'handlerConfig', {
                    type: Sequelize.JSON,
                    allowNull: true,
                    comment: 'Additional configuration for the handler'
                }, { transaction: t }),

                // Enable/disable handlers
                queryInterface.addColumn('intent_listeners', 'enabled', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false
                }, { transaction: t }),

                // Execution mode
                queryInterface.addColumn('intent_listeners', 'executionMode', {
                    type: Sequelize.ENUM('sequential', 'parallel'),
                    defaultValue: 'sequential',
                    allowNull: false,
                    comment: 'How to execute multiple handlers for the same intent'
                }, { transaction: t })
            ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('intent_listeners', 'handlerType', { transaction: t }),
                queryInterface.removeColumn('intent_listeners', 'handlerPath', { transaction: t }),
                queryInterface.removeColumn('intent_listeners', 'handlerConfig', { transaction: t }),
                queryInterface.removeColumn('intent_listeners', 'enabled', { transaction: t }),
                queryInterface.removeColumn('intent_listeners', 'executionMode', { transaction: t })
            ]);
        });
    }
};
