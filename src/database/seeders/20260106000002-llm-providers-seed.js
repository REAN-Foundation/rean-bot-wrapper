const { v4: uuidv4 } = require('uuid');

module.exports = {
    up: (queryInterface, Sequelize) => {
        const now = new Date();
        const llmProviders = [
            {
                id: uuidv4(),
                providerName: 'openai',
                modelName: 'gpt-4o-mini',
                apiConfig: JSON.stringify({
                    apiKeyEnvVar: 'OPENAI_API_KEY',
                    baseUrl: 'https://api.openai.com/v1',
                    temperature: 0.0
                }),
                supportsIntentClassification: true,
                supportsEntityExtraction: true,
                supportsMultilingual: true,
                maxTokens: 1000,
                temperature: 0.0,
                timeoutMs: 10000,
                costPer1kTokens: 0.00015,
                enabled: true,
                priority: 1,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                providerName: 'openai',
                modelName: 'gpt-3.5-turbo',
                apiConfig: JSON.stringify({
                    apiKeyEnvVar: 'OPENAI_API_KEY',
                    baseUrl: 'https://api.openai.com/v1',
                    temperature: 0.0
                }),
                supportsIntentClassification: true,
                supportsEntityExtraction: true,
                supportsMultilingual: true,
                maxTokens: 1000,
                temperature: 0.0,
                timeoutMs: 10000,
                costPer1kTokens: 0.0015,
                enabled: false,
                priority: 2,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                providerName: 'openai',
                modelName: 'gpt-4',
                apiConfig: JSON.stringify({
                    apiKeyEnvVar: 'OPENAI_API_KEY',
                    baseUrl: 'https://api.openai.com/v1',
                    temperature: 0.0
                }),
                supportsIntentClassification: true,
                supportsEntityExtraction: true,
                supportsMultilingual: true,
                maxTokens: 1000,
                temperature: 0.0,
                timeoutMs: 15000,
                costPer1kTokens: 0.03,
                enabled: false,
                priority: 3,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                providerName: 'openai',
                modelName: 'gpt-4-turbo',
                apiConfig: JSON.stringify({
                    apiKeyEnvVar: 'OPENAI_API_KEY',
                    baseUrl: 'https://api.openai.com/v1',
                    temperature: 0.0
                }),
                supportsIntentClassification: true,
                supportsEntityExtraction: true,
                supportsMultilingual: true,
                maxTokens: 1000,
                temperature: 0.0,
                timeoutMs: 12000,
                costPer1kTokens: 0.01,
                enabled: false,
                priority: 4,
                createdAt: now,
                updatedAt: now
            },
            {
                id: uuidv4(),
                providerName: 'claude',
                modelName: 'claude-3-haiku',
                apiConfig: JSON.stringify({
                    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
                    baseUrl: 'https://api.anthropic.com/v1',
                    temperature: 0.0
                }),
                supportsIntentClassification: true,
                supportsEntityExtraction: true,
                supportsMultilingual: true,
                maxTokens: 1000,
                temperature: 0.0,
                timeoutMs: 10000,
                costPer1kTokens: 0.00025,
                enabled: false,
                priority: 5,
                createdAt: now,
                updatedAt: now
            }
        ];

        return queryInterface.bulkInsert('llm_provider_config', llmProviders, {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('llm_provider_config', {
            providerName: {
                [Sequelize.Op.in]: ['openai', 'claude']
            }
        }, {});
    }
};
