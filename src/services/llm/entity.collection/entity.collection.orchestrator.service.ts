import { inject, Lifecycle, scoped } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { EntityCollectionStateMachine } from './entity.collection.state.machine.service';
import { EntityExtractionService } from './entity.extraction.service';
import { EntityValidationService } from './entity.validation.service';
import { QuestionGenerationService } from './question.generation.service';
import { EntityCollectionSessionRepo } from '../../../database/repositories/llm/entity.collection.session.repo';
import { IntentRepo } from '../../../database/repositories/intent/intent.repo';
import { FeatureFlagService } from '../../feature.flags/feature.flag.service';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { ContainerService } from '../../container/container.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import {
    EntityCollectionContext,
    SessionState,
    ConversationTurn,
    ExtractedEntity,
    QuestionGenerationResult,
    EntityDefinition
} from '../../../refactor/interface/llm/entity.collection.interfaces';

export interface EntityCollectionResponse {
    message: string;
    isComplete: boolean;
    collectedEntities?: Map<string, any>;
    sessionStatus: SessionState;
    shouldContinue: boolean;
}

@scoped(Lifecycle.ContainerScoped)
export class EntityCollectionOrchestrator {

    constructor(
        @inject(ClientEnvironmentProviderService) private environmentProviderService: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(EntityCollectionStateMachine) private stateMachine: EntityCollectionStateMachine,
        @inject(EntityExtractionService) private extractionService: EntityExtractionService,
        @inject(EntityValidationService) private validationService: EntityValidationService,
        @inject(QuestionGenerationService) private questionService: QuestionGenerationService,
        @inject(FeatureFlagService) private featureFlagService: FeatureFlagService
    ) {}

    /**
     * Start a new entity collection session
     */
    async startSession(
        intentCode: string,
        userPlatformId: string,
        sessionId: string,
        initialMessage?: string
    ): Promise<EntityCollectionResponse> {

        try {
            // Check if entity collection is enabled
            const isEnabled = await this.featureFlagService.isEnabled(
                'llmEntityCollectionEnabled',
                { userId: userPlatformId }
            );

            if (!isEnabled) {
                throw new Error('Entity collection is not enabled');
            }

            // Get intent configuration
            const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
            const container = ContainerService.createChildContainer(clientName);
            const intent = await IntentRepo.findIntentByCode(container, intentCode);

            if (!intent || !intent.entitySchema) {
                throw new Error(`Intent ${intentCode} has no entity schema defined`);
            }

            // Extract entity definitions from schema
            const requiredEntities = this.parseEntitySchema(intent.entitySchema);

            // Get max turns from conversation config
            const maxTurns = intent.conversationConfig?.maxTurns || 5;

            // Initialize state machine session
            const context = await this.stateMachine.initializeSession(
                sessionId,
                String(intent.id),
                intentCode,
                userPlatformId,
                requiredEntities,
                maxTurns
            );

            // Create database session record
            await this.createDatabaseSession(context);

            // Process initial message if provided
            if (initialMessage) {
                return await this.processMessage(sessionId, initialMessage);
            }

            // Generate first question
            const question = await this.generateNextQuestion(context);

            return {
                message        : question.question,
                isComplete     : false,
                sessionStatus  : SessionState.COLLECTING,
                shouldContinue : true
            };
        } catch (error) {
            console.error('[EntityCollectionOrchestrator] Error starting session:', error);
            throw error;
        }
    }

    /**
     * Process user message in an active session
     */
    async processMessage(
        sessionId: string,
        userMessage: string
    ): Promise<EntityCollectionResponse> {

        try {
            // Get current context
            const context = await this.stateMachine.getContext(sessionId);

            if (!context) {
                throw new Error('Session not found or expired');
            }

            // Extract entities from message
            const extractionResult = await this.extractionService.extractEntities(
                userMessage,
                context.requiredEntities,
                context.conversationHistory.map(h => ({
                    userMessage : h.userMessage,
                    botResponse : h.botResponse
                }))
            );

            // Validate extracted entities
            const validatedEntities: ExtractedEntity[] = [];
            for (const entity of extractionResult.entities) {
                const definition = context.requiredEntities.find(d => d.name === entity.name);
                if (definition) {
                    const validationResult = await this.validationService.validateEntity(
                        entity,
                        definition
                    );

                    entity.validationStatus = validationResult.isValid ? 'valid' : 'invalid';
                    entity.validationErrors = validationResult.errors;
                    entity.value = validationResult.normalizedValue;

                    validatedEntities.push(entity);
                }
            }

            // Transition state machine
            const transition = await this.stateMachine.transition(context, validatedEntities);

            // Handle transition action
            switch (transition.action) {
            case 'ask_question':
                return await this.handleAskQuestion(context, userMessage, validatedEntities);

            case 'validate':
                return await this.handleValidate(context, userMessage, validatedEntities);

            case 'complete':
                return await this.handleComplete(context, userMessage, validatedEntities);

            case 'abandon':
                return await this.handleAbandon(context);

            default:
                throw new Error(`Unknown action: ${transition.action}`);
            }
        } catch (error) {
            console.error('[EntityCollectionOrchestrator] Error processing message:', error);
            throw error;
        }
    }

    /**
     * Handle ask_question action
     */
    private async handleAskQuestion(
        context: EntityCollectionContext,
        userMessage: string,
        extractedEntities: ExtractedEntity[]
    ): Promise<EntityCollectionResponse> {

        // Check if any entities were invalid
        const invalidEntities = extractedEntities.filter(e => e.validationStatus === 'invalid');

        let question: QuestionGenerationResult;

        if (invalidEntities.length > 0) {
            // Generate clarification question
            const invalidEntity = invalidEntities[0];
            const definition = context.requiredEntities.find(d => d.name === invalidEntity.name);

            question = await this.questionService.generateClarificationQuestion(
                definition,
                invalidEntity.value,
                invalidEntity.validationErrors,
                context.conversationHistory
            );
        } else {
            // Generate next question for missing entity
            question = await this.generateNextQuestion(context);
        }

        // Add to conversation history
        context.conversationHistory.push({
            turn              : context.currentTurn,
            userMessage,
            botResponse       : question.question,
            entitiesExtracted : extractedEntities,
            timestamp         : new Date()
        });

        // Update database
        await this.updateDatabaseSession(context);

        return {
            message        : question.question,
            isComplete     : false,
            sessionStatus  : context.currentState,
            shouldContinue : true
        };
    }

    /**
     * Handle validate action
     */
    private async handleValidate(
        context: EntityCollectionContext,
        userMessage: string,
        extractedEntities: ExtractedEntity[]
    ): Promise<EntityCollectionResponse> {

        // Validate all collected entities
        const validationResults = await this.validationService.validateAllEntities(
            context.collectedEntities,
            context.requiredEntities
        );

        // Check if all are valid
        const allValid = Array.from(validationResults.values()).every(r => r.isValid);

        if (!allValid) {
            // Some entities are invalid, go back to collecting
            context.currentState = SessionState.COLLECTING;
            return await this.handleAskQuestion(context, userMessage, extractedEntities);
        }

        // All valid, proceed to completion
        return await this.handleComplete(context, userMessage, extractedEntities);
    }

    /**
     * Handle complete action
     */
    private async handleComplete(
        context: EntityCollectionContext,
        userMessage: string,
        extractedEntities: ExtractedEntity[]
    ): Promise<EntityCollectionResponse> {

        // Add final turn to history
        const confirmationMessage = await this.questionService.generateConfirmationQuestion(
            context.collectedEntities
        );

        context.conversationHistory.push({
            turn              : context.currentTurn,
            userMessage,
            botResponse       : confirmationMessage,
            entitiesExtracted : extractedEntities,
            timestamp         : new Date()
        });

        // Update database with completion
        context.currentState = SessionState.COMPLETED;
        await this.updateDatabaseSession(context);

        // Clear from cache
        await this.stateMachine.clearSession(context.sessionId);

        return {
            message           : confirmationMessage,
            isComplete        : true,
            collectedEntities : context.collectedEntities,
            sessionStatus     : SessionState.COMPLETED,
            shouldContinue    : false
        };
    }

    /**
     * Handle abandon action
     */
    private async handleAbandon(context: EntityCollectionContext): Promise<EntityCollectionResponse> {

        const message = context.currentState === SessionState.TIMEOUT
            ? "I'm sorry, but this session has timed out. Please start over if you'd like to continue."
            : "I wasn't able to collect all the required information. Please try again later.";

        // Update database
        await this.updateDatabaseSession(context);

        // Clear from cache
        await this.stateMachine.clearSession(context.sessionId);

        return {
            message,
            isComplete     : false,
            sessionStatus  : context.currentState,
            shouldContinue : false
        };
    }

    /**
     * Generate next question for missing entity
     */
    private async generateNextQuestion(
        context: EntityCollectionContext
    ): Promise<QuestionGenerationResult> {

        // Get missing required entities
        const missingEntities = context.requiredEntities
            .filter(def => def.required)
            .filter(def => !context.collectedEntities.has(def.name));

        if (missingEntities.length === 0) {
            throw new Error('No missing entities to ask about');
        }

        // Get first missing entity
        const nextEntity = missingEntities[0];

        return await this.questionService.generateQuestion(
            nextEntity,
            context.conversationHistory
        );
    }

    /**
     * Parse entity schema from intent
     */
    private parseEntitySchema(schema: any): EntityDefinition[] {
        return Object.entries(schema).map(([name, config]: [string, any]) => ({
            name,
            type             : config.type,
            required         : config.required,
            description      : config.description,
            validation       : config.validation,
            examples         : config.examples,
            followUpQuestion : config.followUpQuestion
        }));
    }

    /**
     * Create database session record
     */
    private async createDatabaseSession(context: EntityCollectionContext): Promise<void> {
        const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
        const container = ContainerService.createChildContainer(clientName);
        await EntityCollectionSessionRepo.create(container, {
            id                  : uuidv4(),  // Generate proper UUID for database id
            intentId            : context.intentId,
            intentCode          : context.intentCode,  // Store intent code for retrieval
            userPlatformId      : context.userPlatformId,
            sessionId           : context.sessionId,  // Keep custom session ID for lookups
            status              : context.currentState as any,
            currentTurn         : context.currentTurn,
            maxTurns            : context.maxTurns,
            requiredEntities    : context.requiredEntities,
            collectedEntities   : Object.fromEntries(context.collectedEntities),
            conversationHistory : context.conversationHistory,
            startedAt           : new Date(),
            lastActivityAt      : new Date(),
            timeoutAt           : context.timeoutAt
        });
    }

    /**
     * Update database session record
     */
    private async updateDatabaseSession(context: EntityCollectionContext): Promise<void> {
        const clientName = this.environmentProviderService.getClientEnvironmentVariable("NAME");
        const container = ContainerService.createChildContainer(clientName);
        await EntityCollectionSessionRepo.update(container, context.sessionId, {
            status              : context.currentState as any,
            currentTurn         : context.currentTurn,
            collectedEntities   : Object.fromEntries(context.collectedEntities),
            conversationHistory : context.conversationHistory,
            lastActivityAt      : new Date()
        });
    }

    /**
     * Get session status
     */
    async getSessionStatus(sessionId: string): Promise<EntityCollectionContext | null> {
        return await this.stateMachine.getContext(sessionId);
    }

    /**
     * Cancel an active session
     */
    async cancelSession(sessionId: string): Promise<void> {
        const context = await this.stateMachine.getContext(sessionId);

        if (context) {
            context.currentState = SessionState.ABANDONED;
            await this.updateDatabaseSession(context);
            await this.stateMachine.clearSession(sessionId);
        }
    }
}
