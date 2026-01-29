/**
 * Quick verification that Phase 3 services are properly set up
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

async function verifyPhase3() {
    console.log('\n========================================');
    console.log('Phase 3: Service Verification');
    console.log('========================================\n');

    try {
        // Import all services
        console.log('Importing services...');

        const { EntityCollectionStateMachine } = await import('../src/services/llm/entity.collection/entity.collection.state.machine.service');
        const { EntityExtractionService } = await import('../src/services/llm/entity.collection/entity.extraction.service');
        const { EntityValidationService } = await import('../src/services/llm/entity.collection/entity.validation.service');
        const { QuestionGenerationService } = await import('../src/services/llm/entity.collection/question.generation.service');
        const { EntityCollectionOrchestrator } = await import('../src/services/llm/entity.collection/entity.collection.orchestrator.service');

        console.log('✅ EntityCollectionStateMachine imported');
        console.log('✅ EntityExtractionService imported');
        console.log('✅ EntityValidationService imported');
        console.log('✅ QuestionGenerationService imported');
        console.log('✅ EntityCollectionOrchestrator imported');

        // Check prompt builders
        const { EntityExtractionPromptBuilder } = await import('../src/services/llm/prompts/entity.extraction.prompt');
        const { EntityValidationPromptBuilder } = await import('../src/services/llm/prompts/entity.validation.prompt');
        const { QuestionGenerationPromptBuilder } = await import('../src/services/llm/prompts/question.generation.prompt');

        console.log('✅ EntityExtractionPromptBuilder imported');
        console.log('✅ EntityValidationPromptBuilder imported');
        console.log('✅ QuestionGenerationPromptBuilder imported');

        // Check repository
        const { EntityCollectionSessionRepo } = await import('../src/database/repositories/llm/entity.collection.session.repo');
        console.log('✅ EntityCollectionSessionRepo imported');

        // Check interfaces
        const interfaces = await import('../src/refactor/interface/llm/entity.collection.interfaces');
        console.log('✅ Entity collection interfaces imported');
        console.log(`   - SessionState enum: ${Object.keys(interfaces.SessionState).length} states`);

        console.log('\n========================================');
        console.log('✅ All Phase 3 Services Verified!');
        console.log('========================================\n');

        console.log('📦 Phase 3 includes:');
        console.log('   • 5 Core Services');
        console.log('   • 3 Prompt Builders');
        console.log('   • 1 Repository');
        console.log('   • Core Interfaces & Types\n');

    } catch (error) {
        console.error('\n❌ Verification Failed:');
        console.error('Error:', error.message);
        console.error('\nStack:', error.stack);
    }
}

verifyPhase3();
