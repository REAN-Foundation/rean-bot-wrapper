/**
 * Seeder: LLM Intent Feature Flags
 *
 * Creates feature flags for gradual rollout of LLM-native intents.
 * Flags allow enabling/disabling specific intent flows per environment.
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const now = new Date();

        const featureFlags = [
            // Master flag for LLM intent responses
            {
                id: uuidv4(),
                flagName: 'llmIntentResponseEnabled',
                description: 'Master flag: Enable database-driven intent responses (static/listener/hybrid)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: null,
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },

            // Master flag for entity collection
            {
                id: uuidv4(),
                flagName: 'llmEntityCollectionEnabled',
                description: 'Master flag: Enable LLM-based multi-turn entity collection',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: null,
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },

            // Entity collection flag for keratoplasty symptom analysis
            {
                id: uuidv4(),
                flagName: 'entityCollection_keratoplasty_symptom_analysis',
                description: 'Enable entity collection for keratoplasty symptom analysis (collects symptoms)',
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

            // Static intents
            {
                id: uuidv4(),
                flagName: 'llmIntent_default_welcome',
                description: 'Enable LLM-native welcome intent (static response)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify(['default.welcome']),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                flagName: 'llmIntent_faq_general',
                description: 'Enable LLM-native FAQ intent (static response)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify(['faq.general']),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },

            // Keratoplasty flow
            {
                id: uuidv4(),
                flagName: 'llmIntent_keratoplasty_flow',
                description: 'Enable all keratoplasty symptom flow intents',
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

            // Delete user flow
            {
                id: uuidv4(),
                flagName: 'llmIntent_user_delete_flow',
                description: 'Enable LLM-native user data deletion flow',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify([
                    'user.history.delete.confirm',
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
                    'llmIntentResponseEnabled',
                    'llmEntityCollectionEnabled',
                    'entityCollection_keratoplasty_symptom_analysis',
                    'llmIntent_default_welcome',
                    'llmIntent_faq_general',
                    'llmIntent_keratoplasty_flow',
                    'llmIntent_user_delete_flow'
                ]
            }
        }, {});
    }
};
