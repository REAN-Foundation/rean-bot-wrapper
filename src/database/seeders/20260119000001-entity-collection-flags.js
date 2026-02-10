const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: (queryInterface, Sequelize) => {
        const now = new Date();
        const featureFlags = [
            {
                id: uuidv4(),
                flagName: 'llmEntityCollectionEnabled',
                description: 'Enable LLM-based multi-turn entity collection (Phase 3)',
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
            // Flag names are generated from intent codes: entityCollection_${intentCode.replace(/\./g, '_')}
            {
                id: uuidv4(),
                flagName: 'entityCollection_blood_glucose_create',
                description: 'Enable entity collection for blood glucose intent (blood.glucose.create)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify(['blood.glucose.create']),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
                expiresAt: null,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                flagName: 'entityCollection_blood_pressure_create',
                description: 'Enable entity collection for blood pressure intent (blood.pressure.create)',
                enabled: false,
                rolloutPercentage: 0,
                targetIntents: JSON.stringify(['blood.pressure.create']),
                targetUsers: null,
                targetPlatforms: null,
                environments: JSON.stringify(['development', 'staging']),
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
                    'llmEntityCollectionEnabled',
                    'entityCollection_blood_glucose_create',
                    'entityCollection_blood_pressure_create'
                ]
            }
        }, {});
    }
};
