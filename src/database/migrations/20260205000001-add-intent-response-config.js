/**
 * Migration: Add Intent Response Configuration
 *
 * Adds columns to support database-driven intent responses:
 * - responseType: 'static' | 'listener' | 'hybrid'
 * - staticResponse: JSON configuration for static responses
 *
 * This enables:
 * - Static intents that just return a message + buttons (no listener needed)
 * - Listener-based intents that execute business logic
 * - Hybrid intents that return a response AND trigger async processing
 */

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                // Response type determines how the intent is handled
                queryInterface.addColumn('intents', 'responseType', {
                    type: Sequelize.ENUM('static', 'listener', 'hybrid'),
                    defaultValue: 'listener',
                    allowNull: false,
                    comment: 'static=return staticResponse, listener=execute handlers, hybrid=both'
                }, { transaction: t }),

                // Static response configuration (message + optional buttons)
                queryInterface.addColumn('intents', 'staticResponse', {
                    type: Sequelize.JSON,
                    allowNull: true,
                    comment: 'JSON config: {message: string, buttons?: [{text, type, value}]}'
                }, { transaction: t })
            ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn('intents', 'responseType', { transaction: t }),
                queryInterface.removeColumn('intents', 'staticResponse', { transaction: t })
            ]);
        });
    }
};
