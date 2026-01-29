const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: (queryInterface, Sequelize) => {
        const now = new Date();
        const featureFlags = [
            {
                id: uuidv4(),
                flagName: 'llmClassificationEnabled',
                description: 'Enable LLM-based intent classification',
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
            {
                id: uuidv4(),
                flagName: 'llmEntityExtractionEnabled',
                description: 'Enable LLM-based entity extraction',
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
            {
                id: uuidv4(),
                flagName: 'multiTurnEntityCollection',
                description: 'Enable multi-turn entity collection for complex intents',
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
            {
                id: uuidv4(),
                flagName: 'dynamicIntentHandlers',
                description: 'Enable dynamic database-driven intent handler registration',
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
            {
                id: uuidv4(),
                flagName: 'dialogflowFallbackEnabled',
                description: 'Enable fallback to Dialogflow when LLM confidence is low',
                enabled: true,
                rolloutPercentage: 100,
                targetIntents: null,
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging', 'production']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            }
        ];

        return queryInterface.bulkInsert('feature_flags', featureFlags, {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('feature_flags', {
            flagName: {
                [Sequelize.Op.in]: [
                    'llmClassificationEnabled',
                    'llmEntityExtractionEnabled',
                    'multiTurnEntityCollection',
                    'dynamicIntentHandlers',
                    'dialogflowFallbackEnabled'
                ]
            }
        }, {});
    }
};
