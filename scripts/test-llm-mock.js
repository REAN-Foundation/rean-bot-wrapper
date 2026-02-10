/**
 * Mock Integration Test for LLM Infrastructure
 * Tests all components without making actual API calls
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sushant_local', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}${details ? ': ' + details : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n========================================');
    console.log('🧪 LLM Infrastructure Mock Tests');
    console.log('========================================\n');

    // Test 1: Database Connection
    console.log('📦 Database Tests\n');
    try {
        await sequelize.authenticate();
        test('Database connection', true);
    } catch (e) {
        test('Database connection', false, e.message);
        return;
    }

    // Test 2: Feature Flags Table
    try {
        const [flags] = await sequelize.query('SELECT * FROM feature_flags WHERE flagName = "llmClassificationEnabled"');
        test('Feature flag "llmClassificationEnabled" exists', flags.length > 0);
        if (flags.length > 0) {
            test('Feature flag has correct structure', flags[0].enabled !== undefined && flags[0].rolloutPercentage !== undefined);
        }
    } catch (e) {
        test('Feature flags query', false, e.message);
    }

    // Test 3: LLM Provider Config
    try {
        const [providers] = await sequelize.query('SELECT * FROM llm_provider_config WHERE enabled = 1 ORDER BY priority');
        test('At least one LLM provider is enabled', providers.length > 0);
        if (providers.length > 0) {
            test('Default provider is OpenAI', providers[0].providerName === 'openai');
            test('Default model is gpt-4o-mini', providers[0].modelName === 'gpt-4o-mini');
            test('API config has apiKeyEnvVar', providers[0].apiConfig && providers[0].apiConfig.apiKeyEnvVar);
        }
    } catch (e) {
        test('LLM provider config query', false, e.message);
    }

    // Test 4: Intents with LLM columns
    try {
        const [intents] = await sequelize.query('SELECT * FROM intents WHERE llmEnabled = 1');
        test('At least one LLM-enabled intent exists', intents.length > 0);
        if (intents.length > 0) {
            const intent = intents[0];
            test('Intent has code', !!intent.code);
            test('Intent has intentDescription', !!intent.intentDescription);
            test('Intent has confidenceThreshold', intent.confidenceThreshold !== undefined);
        }
    } catch (e) {
        test('Intents query', false, e.message);
    }

    // Test 5: Intent Listeners Table
    try {
        const [columns] = await sequelize.query("SHOW COLUMNS FROM intent_listeners WHERE Field IN ('processingPriority', 'entityDependencies', 'requiredEntityCount', 'optionalEntityCount')");
        test('Intent listeners has LLM columns', columns.length >= 2);
    } catch (e) {
        test('Intent listeners structure', false, e.message);
    }

    // Test 6: Entity Collection Sessions Table
    try {
        const [columns] = await sequelize.query("SHOW COLUMNS FROM entity_collection_sessions");
        test('Entity collection sessions table exists', columns.length > 0);
        const expectedColumns = ['sessionId', 'intentCode', 'sessionState', 'collectedEntities', 'maxTurns'];
        const columnNames = columns.map(c => c.Field);
        const hasAllColumns = expectedColumns.every(col => columnNames.includes(col));
        test('Entity collection sessions has required columns', hasAllColumns);
    } catch (e) {
        test('Entity collection sessions table', false, e.message);
    }

    // Test 7: Intent Classification Logs Table
    try {
        const [columns] = await sequelize.query("SHOW COLUMNS FROM intent_classification_logs");
        test('Intent classification logs table exists', columns.length > 0);
        const expectedColumns = ['userMessage', 'classifiedIntent', 'confidenceScore', 'llmProvider', 'processingTimeMs'];
        const columnNames = columns.map(c => c.Field);
        const hasAllColumns = expectedColumns.every(col => columnNames.includes(col));
        test('Intent classification logs has required columns', hasAllColumns);
    } catch (e) {
        test('Intent classification logs table', false, e.message);
    }

    // Test 8: Prompt Builder Tests (requires transpiled code)
    console.log('\n📦 Service Import Tests\n');

    try {
        // Check if dist exists
        const fs = require('fs');
        const distExists = fs.existsSync('./dist');
        test('Dist folder exists (build completed)', distExists);

        if (distExists) {
            // Test prompt builder
            const { IntentClassificationPromptBuilder } = require('../dist/services/llm/prompts/intent.classification.prompt');
            test('IntentClassificationPromptBuilder imported from dist', !!IntentClassificationPromptBuilder);

            const mockIntents = [{
                Code: 'test_intent',
                Name: 'Test Intent',
                intentDescription: 'A test intent',
                intentExamples: ['test example 1', 'test example 2']
            }];

            const { systemPrompt, userPrompt } = IntentClassificationPromptBuilder.buildPrompt('test message', mockIntents, 'english');
            test('Prompt builder generates system prompt', systemPrompt && systemPrompt.length > 0);
            test('Prompt builder generates user prompt', userPrompt && userPrompt.length > 0);
            test('System prompt contains intent classification instructions', systemPrompt.includes('intent'));
            test('User prompt contains user message', userPrompt.includes('test message'));
        }
    } catch (e) {
        test('Prompt builder test', false, e.message);
    }

    // Test 9: Entity Extraction Prompt Builder
    try {
        const fs = require('fs');
        if (fs.existsSync('./dist')) {
            const { EntityExtractionPromptBuilder } = require('../dist/services/llm/prompts/entity.extraction.prompt');
            test('EntityExtractionPromptBuilder imported', !!EntityExtractionPromptBuilder);

            const mockSchema = {
                glucose_value: { type: 'number', required: true, description: 'Blood glucose reading' },
                measurement_unit: { type: 'string', required: false, description: 'mg/dL or mmol/L' }
            };

            const { systemPrompt, userPrompt } = EntityExtractionPromptBuilder.buildPrompt('My blood sugar is 120', mockSchema);
            test('Entity extraction prompt generated', systemPrompt && userPrompt);
        }
    } catch (e) {
        test('Entity extraction prompt builder', false, e.message);
    }

    // Test 10: Feature Flag Logic Test
    console.log('\n📦 Feature Flag Logic Tests\n');
    try {
        const [enabledFlags] = await sequelize.query("SELECT flagName, enabled, rolloutPercentage FROM feature_flags WHERE enabled = 1");
        test('At least one feature flag is enabled', enabledFlags.length > 0);

        const llmEntityFlag = enabledFlags.find(f => f.flagName === 'llmEntityCollectionEnabled');
        test('llmEntityCollectionEnabled flag is enabled', !!llmEntityFlag && llmEntityFlag.enabled === 1);

        const dialogflowFlag = enabledFlags.find(f => f.flagName === 'dialogflowFallbackEnabled');
        test('dialogflowFallbackEnabled flag is enabled', !!dialogflowFlag && dialogflowFlag.enabled === 1);
    } catch (e) {
        test('Feature flag logic', false, e.message);
    }

    // Summary
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round(passed / (passed + failed) * 100)}%`);
    console.log('========================================\n');

    if (failed === 0) {
        console.log('✅ ALL TESTS PASSED!\n');
        console.log('🎉 LLM Infrastructure is ready for integration testing.');
        console.log('\nNext steps:');
        console.log('1. Set OPENAI_API_KEY environment variable');
        console.log('2. Enable llmClassificationEnabled feature flag in database');
        console.log('3. Configure intents with intentDescription and intentExamples');
        console.log('4. Run the application and test with real messages\n');
    } else {
        console.log('⚠️  Some tests failed. Review the failures above.\n');
    }

    await sequelize.close();
}

runTests().catch(console.error);
