import { inject, Lifecycle, scoped } from "tsyringe";
import { DependencyContainer } from "tsyringe";
import { Logger } from "../../common/logger";
import { IntentRepo } from "../../database/repositories/intent/intent.repo";
import { IntentListenersRepo } from "../../database/repositories/intent/intent.listeners.repo";
import { LLMIntentRegistry } from "../../intentEmitters/llm/llm.intent.registry";
import { LLMEventObject, LLMListenerResponse } from "../../refactor/interface/llm/llm.event.interfaces";
import { StaticResponseConfig, StaticButton, ResponseType } from "../../refactor/interface/intents/intents.interface";
import { IntentDto } from "../../domain.types/intents/intents.domain.model";

/**
 * Response from the IntentResponseService
 */
export interface IntentResponseResult {
    success: boolean;
    message: string;
    buttons?: FormattedButton[];
    data?: any;
    responseType: ResponseType;
    listenerExecuted: boolean;
}

/**
 * Formatted button for response
 */
export interface FormattedButton {
    text: string;
    type: 'intent' | 'url' | 'text';
    value?: string;
}

/**
 * Intent Response Service
 *
 * Handles database-driven intent responses based on responseType:
 * - static: Returns staticResponse directly (message + buttons)
 * - listener: Executes registered listeners
 * - hybrid: Returns staticResponse AND triggers listener async
 *
 * This enables admin panel control over intent behavior without code changes.
 */
@scoped(Lifecycle.ContainerScoped)
export class IntentResponseService {

    private readonly logger = Logger.instance();

    /**
     * Process an intent and return appropriate response
     *
     * @param intentCode - The classified intent code
     * @param event - The LLM event object with context
     * @param container - DI container for service resolution
     * @returns IntentResponseResult
     */
    async processIntent(
        intentCode: string,
        event: LLMEventObject,
        container: DependencyContainer
    ): Promise<IntentResponseResult> {
        this.log(`Processing intent: ${intentCode}`);

        try {

            // 1. Fetch intent configuration from database
            const intentConfig = await IntentRepo.findIntentByCode(container, intentCode);

            if (!intentConfig) {
                this.log(`Intent not found in database: ${intentCode}`);
                return this.createErrorResponse('Intent configuration not found');
            }

            if (!intentConfig.active) {
                this.log(`Intent is not active: ${intentCode}`);
                return this.createErrorResponse('This feature is currently unavailable');
            }

            // 2. Route based on responseType
            const responseType = intentConfig.responseType || 'listener';
            this.log(`Response type for ${intentCode}: ${responseType}`);

            switch (responseType) {
            case 'static':
                return await this.handleStaticResponse(intentConfig, event);

            case 'listener':
                return await this.handleListenerResponse(intentConfig, event, container);

            case 'hybrid':
                return await this.handleHybridResponse(intentConfig, event, container);

            default:
                this.log(`Unknown response type: ${responseType}, defaulting to listener`);
                return await this.handleListenerResponse(intentConfig, event, container);
            }

        } catch (error) {
            this.logError(`Error processing intent ${intentCode}`, error);
            return this.createErrorResponse('An error occurred processing your request');
        }
    }

    /**
     * Handle static response - just return configured message and buttons
     */
    private async handleStaticResponse(
        intentConfig: IntentDto,
        event: LLMEventObject
    ): Promise<IntentResponseResult> {
        this. log(`Handling static response for: ${intentConfig.code}`);

        const staticResponse = intentConfig.staticResponse as StaticResponseConfig;

        if (!staticResponse || !staticResponse.message) {
            this.log(`No static response configured for: ${intentConfig.code}`);
            return this.createErrorResponse('Response not configured');
        }

        const buttons = this.formatButtons(staticResponse.buttons);

        return {
            success          : true,
            message          : staticResponse.message,
            buttons          : buttons.length > 0 ? buttons : undefined,
            responseType     : 'static',
            listenerExecuted : false
        };
    }

    /**
     * Handle listener response - execute registered listeners
     */
    private async handleListenerResponse(
        intentConfig: IntentDto,
        event: LLMEventObject,
        container: DependencyContainer
    ): Promise<IntentResponseResult> {
        this.log(`Handling listener response for: ${intentConfig.code}`);

        // First try LLMIntentRegistry (in-memory registered listeners)
        if (LLMIntentRegistry.has(intentConfig.code)) {
            this.log(`Found listener in LLMIntentRegistry: ${intentConfig.code}`);
            const response = await LLMIntentRegistry.emit(intentConfig.code, event);

            if (response) {
                return this.convertListenerResponse(response, 'listener');
            }
        }

        // Then check database for listener configuration
        const listeners = await IntentListenersRepo.findByIntentId(container, intentConfig.id);

        if (listeners.length === 0) {
            this.log(`No listeners found for intent: ${intentConfig.code}`);

            // If no listeners but has staticResponse, use that as fallback
            if (intentConfig.staticResponse) {
                this.log(`Falling back to staticResponse for: ${intentConfig.code}`);
                return await this.handleStaticResponse(intentConfig, event);
            }

            return this.createErrorResponse('No handler configured for this intent');
        }

        // Execute listeners based on execution mode
        // For now, execute sequentially - first successful response wins
        for (const listener of listeners) {
            this.log(`Executing listener: ${listener.listenerCode}`);

            // Try to find and execute the listener
            if (LLMIntentRegistry.has(listener.listenerCode)) {
                const response = await LLMIntentRegistry.emit(listener.listenerCode, event);
                if (response && response.success) {
                    return this.convertListenerResponse(response, 'listener');
                }
            }
        }

        return this.createErrorResponse('Unable to process your request');
    }

    /**
     * Handle hybrid response - return static response AND trigger listener async
     */
    private async handleHybridResponse(
        intentConfig: IntentDto,
        event: LLMEventObject,
        container: DependencyContainer
    ): Promise<IntentResponseResult> {
        this.log(`Handling hybrid response for: ${intentConfig.code}`);

        // Get static response
        const staticResult = await this.handleStaticResponse(intentConfig, event);

        // Trigger listener asynchronously (fire and forget)
        this.executeListenerAsync(intentConfig, event, container);

        return {
            ...staticResult,
            responseType     : 'hybrid',
            listenerExecuted : true
        };
    }

    /**
     * Execute listener asynchronously (fire and forget)
     */
    private executeListenerAsync(
        intentConfig: IntentDto,
        event: LLMEventObject,
        container: DependencyContainer
    ): void {

        // Don't await - fire and forget
        this.handleListenerResponse(intentConfig, event, container)
            .then(result => {
                this.log(`Async listener completed for ${intentConfig.code}: ${result.success}`);
            })
            .catch(error => {
                this.logError(`Async listener failed for ${intentConfig.code}`, error);
            });
    }

    /**
     * Format buttons from static response config
     */
    private formatButtons(buttons?: StaticButton[]): FormattedButton[] {
        if (!buttons || buttons.length === 0) {
            return [];
        }

        return buttons.map(button => ({
            text  : button.text,
            type  : button.type || 'text',
            value : button.value
        }));
    }

    /**
     * Convert LLMListenerResponse to IntentResponseResult
     */
    private convertListenerResponse(
        response: LLMListenerResponse,
        responseType: ResponseType
    ): IntentResponseResult {
        
        // Extract buttons from response data if present
        let buttons: FormattedButton[] | undefined;

        if (response.data?.followUpButtons) {
            buttons = response.data.followUpButtons.map((btn: any) => ({
                text  : btn.text,
                type  : 'intent' as const,
                value : btn.intentCode
            }));
        }

        return {
            success          : response.success,
            message          : response.message,
            buttons,
            data             : response.data,
            responseType,
            listenerExecuted : true
        };
    }

    /**
     * Create error response
     */
    private createErrorResponse(message: string): IntentResponseResult {
        return {
            success          : false,
            message,
            responseType     : 'listener',
            listenerExecuted : false
        };
    }

    /**
     * Log helper
     */
    private log(message: string): void {
        this.logger.log(`[IntentResponseService] ${message}`);
    }

    /**
     * Error log helper
     */
    private logError(message: string, error: any): void {
        this.logger.log_error(
            `[IntentResponseService] ${message}: ${error instanceof Error ? error.message : error}`,
            500,
            'IntentResponseService'
        );
    }
}
