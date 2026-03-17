/**
 * Test Script for Phase 3: Entity Collection
 *
 * This script tests the multi-turn entity collection functionality.
 */

const { container } = require('tsyringe');
const { v4: uuidv4 } = require('uuid');

// Import services
const { EntityCollectionOrchestrator } = require('../src/services/llm/entity.collection/entity.collection.orchestrator.service');
const { FeatureFlagService } = require('../src/services/feature.flags/feature.flag.service');
const { LLMProviderFactory } = require('../src/services/llm/providers/llm.provider.factory');

async function testEntityCollection() {
    console.log('\n========================================');
    console.log('Phase 3: Entity Collection Test');
    console.log('========================================\n');

    try {
        // Step 1: Verify feature flag
        console.log('Step 1: Checking feature flags...');
        const featureFlagService = container.resolve(FeatureFlagService);
        const isEnabled = await featureFlagService.isEnabled('llmEntityCollectionEnabled', {
            userId: 'test-user-123'
        });
        console.log(`✅ Entity Collection Enabled: ${isEnabled}\n`);

        if (!isEnabled) {
            console.log('❌ Entity collection is not enabled. Please run the setup first.');
            return;
        }

        // Step 2: Verify LLM provider
        console.log('Step 2: Checking LLM provider...');
        const providerFactory = container.resolve(LLMProviderFactory);
        const provider = await providerFactory.getDefaultProvider();
        console.log(`✅ Default Provider: ${provider.providerName} - ${provider.modelName}\n`);

        // Step 3: Start entity collection session
        console.log('Step 3: Starting entity collection session...');
        const orchestrator = container.resolve(EntityCollectionOrchestrator);
        const sessionId = uuidv4();
        const userPlatformId = 'test-user-123';

        const startResponse = await orchestrator.startSession(
            'blood.glucose.create',
            userPlatformId,
            sessionId
        );

        console.log('📝 Bot asks:', startResponse.message);
        console.log(`   Session Status: ${startResponse.sessionStatus}`);
        console.log(`   Is Complete: ${startResponse.isComplete}`);
        console.log(`   Should Continue: ${startResponse.shouldContinue}\n`);

        // Step 4: Provide blood glucose value
        console.log('Step 4: User provides blood glucose value...');
        console.log('👤 User says: "My blood sugar is 120 mg/dL"\n');

        const turn1Response = await orchestrator.processMessage(
            sessionId,
            'My blood sugar is 120 mg/dL'
        );

        console.log('📝 Bot responds:', turn1Response.message);
        console.log(`   Session Status: ${turn1Response.sessionStatus}`);
        console.log(`   Is Complete: ${turn1Response.isComplete}\n`);

        // Step 5: Provide measurement time (if not complete)
        if (!turn1Response.isComplete && turn1Response.shouldContinue) {
            console.log('Step 5: User provides measurement time...');
            console.log('👤 User says: "just now"\n');

            const turn2Response = await orchestrator.processMessage(
                sessionId,
                'just now'
            );

            console.log('📝 Bot responds:', turn2Response.message);
            console.log(`   Session Status: ${turn2Response.sessionStatus}`);
            console.log(`   Is Complete: ${turn2Response.isComplete}\n`);

            // Step 6: Show collected entities
            if (turn2Response.isComplete && turn2Response.collectedEntities) {
                console.log('Step 6: Entity collection completed!');
                console.log('\n✅ COLLECTED ENTITIES:');
                const entities = Array.from(turn2Response.collectedEntities.entries());
                entities.forEach(([name, entity]) => {
                    console.log(`   - ${name}:`);
                    console.log(`     Value: ${entity.value}`);
                    console.log(`     Raw Value: ${entity.rawValue}`);
                    console.log(`     Confidence: ${entity.confidence}`);
                    console.log(`     Validation Status: ${entity.validationStatus}`);
                });
            }
        }

        console.log('\n========================================');
        console.log('✅ Test Completed Successfully!');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ Test Failed:');
        console.error('Error:', error.message);
        console.error('\nStack Trace:');
        console.error(error.stack);
        console.log('\n========================================\n');
    }
}

// Test invalid input handling
async function testInvalidInput() {
    console.log('\n========================================');
    console.log('Testing Invalid Input Handling');
    console.log('========================================\n');

    try {
        const orchestrator = container.resolve(EntityCollectionOrchestrator);
        const sessionId = uuidv4();

        // Start session
        await orchestrator.startSession(
            'blood.glucose.create',
            'test-user-456',
            sessionId
        );

        // Provide invalid input
        console.log('👤 User says: "abc" (invalid number)\n');

        const response = await orchestrator.processMessage(
            sessionId,
            'abc'
        );

        console.log('📝 Bot responds:', response.message);
        console.log('   (Should ask for clarification)\n');

        console.log('✅ Invalid input handling works!\n');

    } catch (error) {
        console.error('❌ Invalid input test failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    console.log('\n🧪 Running Phase 3 Entity Collection Tests\n');

    // Test 1: Normal flow
    await testEntityCollection();

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Invalid input
    await testInvalidInput();

    console.log('\n🎉 All tests completed!\n');
    process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

// Run tests
runAllTests();
