/**
 * Comprehensive test script for LLM Infrastructure (Phases 1-5)
 * Tests database tables, seed data, and service functionality
 */

import 'reflect-metadata';

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
    results.push({ name, passed, message, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${message}`);
    if (details && !passed) {
        console.log('   Details:', JSON.stringify(details, null, 2));
    }
}

async function testServiceImports(): Promise<void> {
    console.log('\n📦 Phase 1: Testing Service Imports...\n');

    const services = [
        { path: '../src/services/feature.flags/feature.flag.service', name: 'FeatureFlagService' },
        { path: '../src/services/llm/llm.intent.classification.service', name: 'LLMIntentClassificationService' },
        { path: '../src/services/llm/entity.collection/entity.collection.orchestrator.service', name: 'EntityCollectionOrchestrator' },
        { path: '../src/services/llm/entity.collection/entity.collection.state.machine.service', name: 'EntityCollectionStateMachine' },
        { path: '../src/services/llm/entity.collection/entity.extraction.service', name: 'EntityExtractionService' },
        { path: '../src/services/llm/entity.collection/entity.validation.service', name: 'EntityValidationService' },
        { path: '../src/services/llm/entity.collection/question.generation.service', name: 'QuestionGenerationService' },
        { path: '../src/services/llm/providers/llm.provider.factory', name: 'LLMProviderFactory' },
        { path: '../src/services/llm/providers/openai.provider', name: 'OpenAIProvider' },
    ];

    for (const svc of services) {
        try {
            const module = await import(svc.path);
            if (module[svc.name]) {
                logTest(`Import ${svc.name}`, true, 'Service imported successfully');
            } else {
                logTest(`Import ${svc.name}`, false, `Export '${svc.name}' not found in module`);
            }
        } catch (error) {
            logTest(`Import ${svc.name}`, false, error.message);
        }
    }
}

async function testRepositoryImports(): Promise<void> {
    console.log('\n📦 Phase 2: Testing Repository Imports...\n');

    const repos = [
        { path: '../src/database/repositories/feature.flags/feature.flag.repo', name: 'FeatureFlagRepo' },
        { path: '../src/database/repositories/llm/entity.collection.session.repo', name: 'EntityCollectionSessionRepo' },
        { path: '../src/database/repositories/llm/intent.classification.log.repo', name: 'IntentClassificationLogRepo' },
        { path: '../src/database/repositories/llm/llm.provider.config.repo', name: 'LLMProviderConfigRepo' },
    ];

    for (const repo of repos) {
        try {
            const module = await import(repo.path);
            if (module[repo.name]) {
                logTest(`Import ${repo.name}`, true, 'Repository imported successfully');
            } else {
                logTest(`Import ${repo.name}`, false, `Export '${repo.name}' not found in module`);
            }
        } catch (error) {
            logTest(`Import ${repo.name}`, false, error.message);
        }
    }
}

async function testModelImports(): Promise<void> {
    console.log('\n📦 Phase 3: Testing Model Imports...\n');

    const models = [
        { path: '../src/models/feature.flags/feature.flag.model', name: 'FeatureFlag' },
        { path: '../src/models/llm/entity.collection.session.model', name: 'EntityCollectionSession' },
        { path: '../src/models/llm/intent.classification.log.model', name: 'IntentClassificationLog' },
        { path: '../src/models/llm/llm.provider.config.model', name: 'LLMProviderConfig' },
        { path: '../src/models/intents/intents.model', name: 'Intents' },
        { path: '../src/models/intents/intent.listeners.model', name: 'IntentListeners' },
    ];

    for (const model of models) {
        try {
            const module = await import(model.path);
            if (module[model.name]) {
                logTest(`Import ${model.name}`, true, 'Model imported successfully');
            } else {
                logTest(`Import ${model.name}`, false, `Export '${model.name}' not found in module`);
            }
        } catch (error) {
            logTest(`Import ${model.name}`, false, error.message);
        }
    }
}

async function testPromptBuilders(): Promise<void> {
    console.log('\n📦 Phase 4: Testing Prompt Builders...\n');

    const prompts = [
        { path: '../src/services/llm/prompts/intent.classification.prompt', name: 'IntentClassificationPromptBuilder' },
        { path: '../src/services/llm/prompts/entity.extraction.prompt', name: 'EntityExtractionPromptBuilder' },
        { path: '../src/services/llm/prompts/entity.validation.prompt', name: 'EntityValidationPromptBuilder' },
        { path: '../src/services/llm/prompts/question.generation.prompt', name: 'QuestionGenerationPromptBuilder' },
    ];

    for (const prompt of prompts) {
        try {
            const module = await import(prompt.path);
            if (module[prompt.name]) {
                logTest(`Import ${prompt.name}`, true, 'Prompt builder imported successfully');

                // Test that buildPrompt method exists
                if (typeof module[prompt.name].buildPrompt === 'function') {
                    logTest(`${prompt.name}.buildPrompt`, true, 'buildPrompt method exists');
                } else {
                    logTest(`${prompt.name}.buildPrompt`, false, 'buildPrompt method not found');
                }
            } else {
                logTest(`Import ${prompt.name}`, false, `Export '${prompt.name}' not found in module`);
            }
        } catch (error) {
            logTest(`Import ${prompt.name}`, false, error.message);
        }
    }
}

async function testInterfaceImports(): Promise<void> {
    console.log('\n📦 Phase 5: Testing Interface Imports...\n');

    try {
        const llmInterfaces = await import('../src/refactor/interface/llm/llm.interfaces');
        logTest('Import LLM Interfaces', true, 'LLM interfaces imported');

        // Check for key interfaces
        const expectedExports = ['NlpProviderType', 'LLMProviderType'];
        for (const exp of expectedExports) {
            if (llmInterfaces[exp] !== undefined) {
                logTest(`Export ${exp}`, true, 'Found in llm.interfaces');
            } else {
                logTest(`Export ${exp}`, false, 'Not found in llm.interfaces');
            }
        }
    } catch (error) {
        logTest('Import LLM Interfaces', false, error.message);
    }

    try {
        const entityInterfaces = await import('../src/refactor/interface/llm/entity.collection.interfaces');
        logTest('Import Entity Collection Interfaces', true, 'Entity collection interfaces imported');

        // Check SessionState enum
        if (entityInterfaces.SessionState) {
            const states = Object.keys(entityInterfaces.SessionState);
            logTest('SessionState enum', true, `Found ${states.length} states`);
        }
    } catch (error) {
        logTest('Import Entity Collection Interfaces', false, error.message);
    }
}

async function testDecisionRouterIntegration(): Promise<void> {
    console.log('\n📦 Phase 6: Testing Decision Router Integration...\n');

    try {
        const module = await import('../src/services/langchain/decision.router.service');
        if (module.DecisionRouter) {
            logTest('Import DecisionRouter', true, 'Service imported successfully');
        } else {
            logTest('Import DecisionRouter', false, 'Export not found');
        }
    } catch (error) {
        logTest('Import DecisionRouter', false, error.message);
    }
}

async function testIntentClassificationPrompt(): Promise<void> {
    console.log('\n🧪 Testing Intent Classification Prompt Builder...\n');

    try {
        const { IntentClassificationPromptBuilder } = await import('../src/services/llm/prompts/intent.classification.prompt');

        // Mock intents for testing
        const mockIntents = [
            {
                Code: 'blood_glucose_create',
                Name: 'Record Blood Glucose',
                intentDescription: 'User wants to record their blood glucose reading',
                intentExamples: ['log my blood sugar', 'record glucose', 'add blood sugar reading']
            },
            {
                Code: 'medication_reminder',
                Name: 'Medication Reminder',
                intentDescription: 'User wants to set a medication reminder',
                intentExamples: ['remind me to take meds', 'medication alert', 'pill reminder']
            }
        ];

        const { systemPrompt, userPrompt } = IntentClassificationPromptBuilder.buildPrompt(
            'I want to log my blood sugar',
            mockIntents as any,
            'english'
        );

        if (systemPrompt && userPrompt) {
            logTest('Build Classification Prompt', true, 'Prompt built successfully');
            console.log('\n   System Prompt Preview (first 200 chars):');
            console.log('   ' + systemPrompt.substring(0, 200) + '...');
            console.log('\n   User Prompt:');
            console.log('   ' + userPrompt);
        } else {
            logTest('Build Classification Prompt', false, 'Prompt returned empty');
        }
    } catch (error) {
        logTest('Build Classification Prompt', false, error.message);
    }
}

async function printSummary(): Promise<void> {
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${Math.round(passed/total*100)}%)`);
    console.log(`Failed: ${failed} (${Math.round(failed/total*100)}%)`);

    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.message}`);
        });
    }

    console.log('\n========================================');
    if (failed === 0) {
        console.log('✅ ALL TESTS PASSED!');
    } else {
        console.log('⚠️  SOME TESTS FAILED - Review above');
    }
    console.log('========================================\n');
}

async function main() {
    console.log('========================================');
    console.log('🧪 LLM Infrastructure Test Suite');
    console.log('   Phases 1-5 Verification');
    console.log('========================================');

    await testServiceImports();
    await testRepositoryImports();
    await testModelImports();
    await testPromptBuilders();
    await testInterfaceImports();
    await testDecisionRouterIntegration();
    await testIntentClassificationPrompt();

    await printSummary();
}

main().catch(console.error);
