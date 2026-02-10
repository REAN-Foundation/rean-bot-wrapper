/**
 * Seeder: LLM Intent Feature Flags
 *
 * Creates feature flags for gradual rollout of LLM-native intents:
 * - Keratoplasty flow flags
 * - Delete user flow flags
 *
 * These flags allow enabling/disabling specific LLM intents per environment.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        const featureFlags = [
            // -------------------------------------------------
            // Keratoplasty Flow Flags
            // -------------------------------------------------
            {
                id: uuidv4(),
                flagName: 'llmIntent_keratoplasty_symptom_analysis',
                description: 'Enable LLM-native keratoplasty symptom analysis intent',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify(['keratoplasty.symptom.analysis']),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                flagName: 'llmIntent_keratoplasty_flow',
                description: 'Enable all LLM-native keratoplasty flow intents (symptom analysis, followup, image, responses)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify([
                    'keratoplasty.symptom.analysis',
                    'keratoplasty.symptom.more',
                    'keratoplasty.followup',
                    'keratoplasty.eye.image',
                    'keratoplasty.response.no',
                    'keratoplasty.response.yes'
                ]),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },

            // -------------------------------------------------
            // Delete User Flow Flags
            // -------------------------------------------------
            {
                id: uuidv4(),
                flagName: 'llmIntent_user_history_delete',
                description: 'Enable LLM-native user history deletion intents (yes/no confirmation)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify([
                    'user.history.delete.yes',
                    'user.history.delete.no'
                ]),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            }
        ];

        await queryInterface.bulkInsert('feature_flags', featureFlags, {});

        console.log('LLM Intent feature flags seeded successfully');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('feature_flags', {
            flagName: {
                [Sequelize.Op.in]: [
                    'llmIntent_keratoplasty_symptom_analysis',
                    'llmIntent_keratoplasty_flow',
                    'llmIntent_user_history_delete'
                ]
            }
        }, {});

        console.log('LLM Intent feature flags removed');
    }
};
