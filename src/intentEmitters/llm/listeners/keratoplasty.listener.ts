import { scoped, Lifecycle } from 'tsyringe';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { kerotoplastyService } from '../../../services/kerotoplasty.service';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { CacheMemory } from '../../../services/cache.memory.service';

/**
 * LLM-native Keratoplasty Symptom Analysis Listener
 *
 * Handles keratoplasty symptom analysis flow without Dialogflow dependencies.
 * Analyzes user-reported symptoms and classifies them by severity.
 *
 * Flow:
 * 1. User reports symptoms (free text or button)
 * 2. LLM extracts symptoms array
 * 3. System classifies severity (Emergency/Attention/Normal)
 * 4. Posts to ClickUp for tracking
 * 5. Asks follow-up questions via buttons
 *
 * Expected entities:
 * - symptoms (required): Array of symptom strings
 *
 * Intent code: keratoplasty.symptom.analysis
 */
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastySymptomAnalysisListener extends BaseLLMListener {

    readonly intentCode = 'keratoplasty.symptom.analysis';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing keratoplasty symptom analysis for user: ${event.userId}`);

        try {
            // Get services from container
            const kerotoplastyServiceObj = this.resolve(event, kerotoplastyService);
            const clientEnvService = this.resolve(event, ClientEnvironmentProviderService);

            // Extract symptoms from entities
            const symptoms = this.getEntity<string[]>(event, 'symptoms') || [];

            if (!symptoms || symptoms.length === 0) {
                this.log('No symptoms provided, asking user to describe');
                return this.success(
                    'To better understand your condition, could you please describe your symptoms? ' +
                    'For example: redness, pain, blurred vision, discharge, etc.'
                );
            }

            // Get risk classification config
            const additionalInfo = await clientEnvService.getClientEnvironmentVariable('AdditionalInfoSettings');
            const parsedInfo = JSON.parse(additionalInfo.Value.RequiredInfo);

            // Classify symptoms by severity
            const { priority, message } = this.classifySymptoms(symptoms, parsedInfo);

            // Cache symptoms for accumulation across turns
            const cacheKey = `KeratoplastySymptomsStorage:${event.userId}`;
            await this.cacheSymptomData(cacheKey, priority, message);

            // Format response message
            let outputMessage: string;
            if (priority === 1) {
                // Emergency - immediate attention needed
                outputMessage = message;
            } else if (priority > 1) {
                // Format symptoms list naturally
                const formattedSymptoms = this.formatSymptomsList(symptoms);
                outputMessage = `Thanks for sharing your symptoms: *${formattedSymptoms}*`;
            } else {
                outputMessage = 'To better understand your condition, we\'ll ask you a few quick questions. This will help us guide you effectively.';
            }

            // Post to ClickUp if priority is set
            if (priority !== 0) {
                this.postToClickUpAsync(kerotoplastyServiceObj, event, priority, symptoms);
            }

            this.log(`Keratoplasty symptom analysis complete. Priority: ${priority}, Symptoms: ${symptoms.join(', ')}`);

            return {
                success : true,
                message : outputMessage,
                data    : {
                    symptoms,
                    priority,
                    severityLevel   : this.getSeverityLabel(priority),
                    followUpButtons : priority !== 0 ? this.getFollowUpButtons(priority) : null
                }
            };

        } catch (error) {
            this.logError('Error processing keratoplasty symptom analysis', error);
            return this.error(
                'I apologize, but I encountered an issue processing your symptoms. Please try again.'
            );
        }
    }

    /**
     * Classify symptoms by severity based on configuration
     */
    private classifySymptoms(
        symptoms: string[],
        config: any
    ): { priority: number; message: string } {
        const emergencySymptoms = config.RISK_CLASSIFICATION?.EMERGENCY?.SYMPTOMS || [];
        const attentionSymptoms = config.RISK_CLASSIFICATION?.ATTENTION_NEEDED?.SYMPTOMS || [];
        const normalSymptoms = config.RISK_CLASSIFICATION?.NORMAL?.SYMPTOMS || [];

        // Check Emergency first (highest priority)
        if (symptoms.some(s => emergencySymptoms.includes(s))) {
            return {
                priority : 1,
                message  : config.RISK_CLASSIFICATION.EMERGENCY.MESSAGE
            };
        }

        // Check Attention Needed
        if (symptoms.some(s => attentionSymptoms.includes(s))) {
            return {
                priority : 2,
                message  : config.RISK_CLASSIFICATION.ATTENTION_NEEDED.MESSAGE
            };
        }

        // Check Normal
        if (symptoms.some(s => normalSymptoms.includes(s))) {
            return {
                priority : 3,
                message  : config.RISK_CLASSIFICATION.NORMAL.MESSAGE
            };
        }

        // No match
        return { priority: 0, message: '' };
    }

    /**
     * Cache symptom data for multi-turn accumulation
     */
    private async cacheSymptomData(
        cacheKey: string,
        priority: number,
        message: string
    ): Promise<void> {
        const existingCache = await CacheMemory.get(cacheKey);

        if (!existingCache) {
            await CacheMemory.set(cacheKey, { priority, message });
        } else {
            // Keep higher priority (lower number = higher priority)
            if (priority < existingCache.priority) {
                await CacheMemory.set(cacheKey, { priority, message });
            }
        }
    }

    /**
     * Format symptoms list for display
     */
    private formatSymptomsList(symptoms: string[]): string {
        if (symptoms.length === 0) return '';
        if (symptoms.length === 1) return symptoms[0];
        if (symptoms.length === 2) return `${symptoms[0]} and ${symptoms[1]}`;

        const last = symptoms[symptoms.length - 1];
        const rest = symptoms.slice(0, -1);
        return `${rest.join(', ')} and ${last}`;
    }

    /**
     * Get severity level label
     */
    private getSeverityLabel(priority: number): string {
        switch (priority) {
        case 1: return 'emergency';
        case 2: return 'attention_needed';
        case 3: return 'normal';
        default: return 'unknown';
        }
    }

    /**
     * Get follow-up buttons based on priority
     */
    private getFollowUpButtons(priority: number): { text: string; intentCode: string }[] {
        if (priority === 1) {
            // Emergency - ask for image
            return [
                { text: 'Provide an image', intentCode: 'keratoplasty.eye.image' },
                { text: 'No', intentCode: 'keratoplasty.response.no' }
            ];
        }
        // Non-emergency - ask for more symptoms
        return [
            { text: 'More symptoms', intentCode: 'keratoplasty.symptom.more' },
            { text: 'No, that\'s all', intentCode: 'keratoplasty.followup' }
        ];
    }

    /**
     * Post to ClickUp asynchronously (fire and forget)
     */
    private postToClickUpAsync(
        service: kerotoplastyService,
        event: LLMEventObject,
        priority: number,
        symptoms: string[]
    ): void {
        // Create a mock eventObj structure for compatibility with existing service
        const mockEventObj = {
            body : {
                queryResult : {
                    parameters : { symptoms }
                },
                originalDetectIntentRequest : {
                    payload : {
                        userId : event.userId
                    }
                }
            },
            container : event.container
        };

        // Fire and forget - don't await
        service.postingOnClickup(this.intentCode, mockEventObj, priority)
            .catch(err => this.logError('Error posting to ClickUp', err));
    }
}

/**
 * LLM-native Keratoplasty More Symptoms Listener
 *
 * Handles when user wants to report additional symptoms.
 * Triggered via button click: "Yes, I have more symptoms"
 */
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastyMoreSymptomsListener extends BaseLLMListener {

    readonly intentCode = 'keratoplasty.symptom.more';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`User wants to report more keratoplasty symptoms: ${event.userId}`);

        // Simply prompt user to describe more symptoms
        // The next message will be routed to keratoplasty.symptom.analysis via LLM classification
        return this.success(
            'Please describe any additional symptoms you\'re experiencing.'
        );
    }
}

/**
 * LLM-native Keratoplasty Follow-up Listener
 *
 * Handles follow-up after all symptoms are collected.
 * Triggered via button click: "No, that's all"
 */
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastyFollowupListener extends BaseLLMListener {

    readonly intentCode = 'keratoplasty.followup';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Keratoplasty followup for user: ${event.userId}`);

        try {
            // Get cached symptom data
            const cacheKey = `KeratoplastySymptomsStorage:${event.userId}`;
            const cachedData = await CacheMemory.get(cacheKey);

            let message: string;
            if (cachedData && cachedData.message) {
                message = cachedData.message;
            } else {
                message = 'Thank you for providing your symptoms. Our team will review and get back to you.';
            }

            // Clear cache after followup
            await CacheMemory.delete(cacheKey);

            return {
                success : true,
                message,
                data    : {
                    followupComplete : true,
                    nextStep         : 'image_request',
                    followUpButtons  : [
                        { text: 'Yes', intentCode: 'keratoplasty.eye.image' },
                        { text: 'No', intentCode: 'keratoplasty.response.no' }
                    ],
                    followUpMessage : 'Would you be able to provide an *image of the affected area of your eye* for the doctor\'s assessment?'
                }
            };

        } catch (error) {
            this.logError('Error in keratoplasty followup', error);
            return this.error('An error occurred. Please try again.');
        }
    }
}

/**
 * LLM-native Keratoplasty Eye Image Listener
 *
 * Handles eye image submission for assessment.
 * Triggered when user agrees to provide an image.
 */
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastyEyeImageListener extends BaseLLMListener {

    readonly intentCode = 'keratoplasty.eye.image';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Keratoplasty eye image submission for user: ${event.userId}`);

        // Check if image URL is provided
        let imageUrl = this.getEntity<string>(event, 'imageUrl');

        // If no direct imageUrl, try to extract from text
        if (!imageUrl) {
            const textContent = this.getEntity<string>(event, 'text');
            if (textContent) {
                imageUrl = this.extractUrlFromText(textContent);
            }
        }

        if (!imageUrl) {
            // Prompt user to send image
            return this.success(
                'Please send a clear photo of the affected area of your eye. ' +
                'Make sure there\'s good lighting and the image is focused.'
            );
        }

        // Image received - process it
        try {
            const kerotoplastyServiceObj = this.resolve(event, kerotoplastyService);

            // Create mock eventObj for service compatibility
            const mockEventObj = {
                body : {
                    queryResult : {
                        parameters : { imageUrl },
                        queryText  : imageUrl
                    },
                    originalDetectIntentRequest : {
                        payload : { userId: event.userId }
                    }
                },
                container : event.container
            };

            await kerotoplastyServiceObj.postingImage(mockEventObj);

            return {
                success : true,
                message : 'We\'ve successfully received your photo. The *quality looks good* for further assessment.',
                data    : {
                    imageReceived   : true,
                    followUpMessage : 'Are you taking your prescribed medications regularly?',
                    followUpButtons : [
                        { text: 'Yes', intentCode: 'keratoplasty.response.yes' },
                        { text: 'No', intentCode: 'keratoplasty.response.no' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing keratoplasty eye image', error);
            return this.error('There was an issue processing your image. Please try again.');
        }
    }

    /**
     * Extract URL from text content
     * Supports http, https, and common image hosting patterns
     */
    private extractUrlFromText(text: string): string | null {
        if (!text) {
            return null;
        }

        // URL regex pattern - matches http/https URLs
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const matches = text.match(urlRegex);

        if (matches && matches.length > 0) {
            // Return the first URL found
            const url = matches[0];
            this.log(`Extracted URL from text: ${url}`);
            return url;
        }

        this.log('No URL found in text content');
        return null;
    }
}

/**
 * LLM-native Keratoplasty Response No Listener
 *
 * Handles negative responses in the keratoplasty symptom flow.
 */
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastyResponseNoListener extends BaseLLMListener {

    readonly intentCode = 'keratoplasty.response.no';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Negative response in keratoplasty flow: ${event.userId}`);

        // Clear symptom cache
        const cacheKey = `KeratoplastySymptomsStorage:${event.userId}`;
        await CacheMemory.delete(cacheKey);

        return this.success(
            'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!'
        );
    }
}

/**
 * LLM-native Keratoplasty Response Yes Listener
 *
 * Handles affirmative responses (e.g., taking medications regularly).
 */
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastyResponseYesListener extends BaseLLMListener {

    readonly intentCode = 'keratoplasty.response.yes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Affirmative response in keratoplasty flow: ${event.userId}`);

        return this.success(
            'That\'s great to hear! Consistent medication is important for your recovery. ' +
            'Our team will review your case and reach out if needed. Take care!'
        );
    }
}
