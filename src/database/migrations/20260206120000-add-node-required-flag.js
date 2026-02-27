/**
 * Migration: Add is_node_required column to assessment_session_logs
 *
 * Purpose: Store the required flag at the node level to determine if a
 * specific question in an assessment must be answered before allowing
 * the user to proceed to other intents.
 *
 * Date: 2026-02-06
 */

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.addColumn(
                    'assessment_session_logs',
                    'is_node_required',
                    {
                        type         : Sequelize.BOOLEAN,
                        allowNull    : false,
                        defaultValue : false,
                        comment      : 'Flag indicating if this specific assessment node/question is required'
                    },
                    { transaction: t }
                ),
                queryInterface.addColumn(
                    'assessment_session_logs',
                    'retry_count',
                    {
                        type         : Sequelize.INTEGER,
                        allowNull    : false,
                        defaultValue : 0,
                        comment      : 'Number of times user provided invalid response for this node'
                    },
                    { transaction: t }
                )
            ]);
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(t => {
            return Promise.all([
                queryInterface.removeColumn(
                    'assessment_session_logs',
                    'is_node_required',
                    { transaction: t }
                ),
                queryInterface.removeColumn(
                    'assessment_session_logs',
                    'retry_count',
                    { transaction: t }
                )
            ]);
        });
    }
};
