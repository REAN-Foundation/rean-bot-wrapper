import { Lifecycle, scoped } from 'tsyringe';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { kerotoplastyService } from '../../../services/kerotoplasty.service';
import { CacheMemory } from '../../../services/cache.memory.service';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';

/**
 * Simplified Symptom Flow Listeners
 *
 * Linear flow:
 * 1. reportSymptoms → Prompt for symptoms
 * 2. symptomAnalysis → Risk assessment + image request
 * 3. provideImageYes → Prompt for image
 * 4. provideImageNo → Completion
 * 5. eyeImage → Quality check + medication question
 * 6. medicationYes/No → Completion
 */

// ============================================
// 1. REPORT SYMPTOMS LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ReportSymptomsListener extends BaseLLMListener {

    readonly intentCode = 'reportSymptoms';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Report symptoms triggered for user: ${event.userId}`);

        return this.success(
            'Please describe the symptoms you are experiencing in your operated eye.'
        );
    }
}

// ============================================
// 2. SYMPTOM ANALYSIS LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class SymptomAnalysisListener extends BaseLLMListener {

    readonly intentCode = 'symptomAnalysis';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Analyzing symptoms for user: ${event.userId}`);

        try {
            // Get services
            const kerotoplastyServiceObj = this.resolve(event, kerotoplastyService);
            const clientEnvService = this.resolve(event, ClientEnvironmentProviderService);

            // Extract symptoms
            const symptoms = this.normalizeToArray(this.getEntity(event, 'symptoms'));

            if (!symptoms || symptoms.length === 0) {
                return this.success('Please describe the symptoms you are experiencing in your operated eye.');
            }

            // Get risk classification config
            const additionalInfo = await clientEnvService.getClientEnvironmentVariable('AdditionalInfoSettings');
            const parsedInfo = JSON.parse(additionalInfo.Value.RequiredInfo);

            // Classify symptoms by severity
            const { priority, message } = this.classifySymptoms(symptoms, parsedInfo);

            // Cache symptom data for followup
            const cacheKey = `SymptomsStorage:${event.userId}`;
            await this.cacheSymptomData(cacheKey, priority, message);

            // Format output message
            let outputMessage: string;
            if (priority === 1) {
                // Emergency - use urgent message directly
                outputMessage = message;
            } else if (priority > 1) {
                // Format symptoms list naturally
                const formattedSymptoms = this.formatSymptomsList(symptoms);
                outputMessage = `Thanks for sharing your symptoms: *${formattedSymptoms}*\n\n${message}`;
            } else {
                outputMessage = 'To better understand your condition, we\'ll ask you a few quick questions. This will help us guide you effectively.';
            }

            // Post to ClickUp if priority is set
            if (priority !== 0) {
                this.postToClickUpAsync(kerotoplastyServiceObj, event, priority, symptoms);
            }

            this.log(`Risk assessment complete: Priority ${priority}, Symptoms: ${symptoms.join(', ')}`);

            // Return response with image request
            return {
                success : true,
                message : outputMessage,
                data    : {
                    symptoms,
                    priority,
                    severityLevel   : this.getSeverityLabel(priority),
                    followUpMessage : 'Would you be able to provide an image of your affected eye?',
                    followUpButtons : [
                        { text: 'Yes', intentCode: 'provideImageYes' },
                        { text: 'No', intentCode: 'provideImageNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error analyzing symptoms', error);
            return this.error('I apologize, but I encountered an issue processing your symptoms. Please try again.');
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
     * Cache symptom data for multi-turn conversation
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
     * Post to ClickUp asynchronously (fire and forget)
     */
    private postToClickUpAsync(
        service: kerotoplastyService,
        event: LLMEventObject,
        priority: number,
        symptoms: string[]
    ): void {
        // Create mock eventObj for service compatibility
        const mockEventObj = {
            body : {
                queryResult : {
                    parameters : { symptoms }
                },
                originalDetectIntentRequest : {
                    payload : { userId: event.userId }
                }
            },
            container : event.container
        };

        // Fire and forget - don't await
        service.postingOnClickup('symptomAnalysis', mockEventObj, priority)
            .catch(err => this.logError('Error posting to ClickUp', err));
    }

    private normalizeToArray(value: any): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
    }
}

// ============================================
// 3. PROVIDE IMAGE YES LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ProvideImageYesListener extends BaseLLMListener {

    readonly intentCode = 'provideImageYes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Image consent received for user: ${event.userId}`);

        return this.success(
            'Please send a clear photo of your operated eye. Make sure there\'s good lighting and the image is focused.'
        );
    }
}

// ============================================
// 4. PROVIDE IMAGE NO LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ProvideImageNoListener extends BaseLLMListener {

    readonly intentCode = 'provideImageNo';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`User declined image submission: ${event.userId}`);

        try {

            // Get cached symptom data to provide context-aware message
            const cacheKey = `SymptomsStorage:${event.userId}`;
            const cachedData = await CacheMemory.get(cacheKey);

            let message: string;
            if (cachedData && cachedData.message) {

                // If we have a cached message, show it again for context
                message = `${cachedData.message}\n\nThank you for the information. If you experience any changes or new symptoms, please don't hesitate to reach out. Take care!`;
            } else {
                message = 'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!';
            }

            // Clear cache after conversation ends
            await CacheMemory.delete(cacheKey);

            return this.success(message);

        } catch (error) {
            this.logError('Error in provideImageNo', error);
            return this.success(
                'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!'
            );
        }
    }
}

// ============================================
// 5. EYE IMAGE LISTENER (Simplified)
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class SimplifiedEyeImageListener extends BaseLLMListener {

    readonly intentCode = 'eyeImage';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing eye image for user: ${event.userId}`);

        try {
            
            // Extract image URL
            const imageUrl = this.normalizeToArray(this.getEntity(event, 'imageUrl'));

            if (imageUrl.length === 0) {
                return this.success(
                    'Please send a clear photo of your operated eye. ' +
                    'Make sure there\'s good lighting and the image is focused.'
                );
            }

            // Get kerotoplasty service
            const kerotoplastyServiceObj = this.resolve(event, kerotoplastyService);

            // Create mock eventObj
            const mockEventObj = {
                body : {
                    queryResult : {
                        parameters : { imageUrl: imageUrl[0] },
                        queryText  : imageUrl[0]
                    },
                    originalDetectIntentRequest : {
                        payload : { userId: event.userId }
                    }
                },
                container : event.container
            };

            // Post image to ClickUp
            await kerotoplastyServiceObj.postingImage(mockEventObj);

            // TODO: Image quality check
            // const qualityCheckResult = await this.checkImageQuality(imageUrl[0]);
            // if (!qualityCheckResult.passed) {
            //     return this.success(
            //         'The image quality is not sufficient for assessment. Please retake the photo ensuring:\n' +
            //         '- Good lighting\n' +
            //         '- Clear focus on the affected area\n' +
            //         '- No blur or glare'
            //     );
            // }

            this.log(`Image received and posted to ClickUp: ${imageUrl[0]}`);

            return {
                success : true,
                message : 'We\'ve successfully received your photo. The *quality looks good* for further assessment.',
                data    : {
                    imageUrl        : imageUrl[0],
                    imageReceived   : true,
                    followUpMessage : 'Are you taking your prescribed medications regularly?',
                    followUpButtons : [
                        { text: 'Yes', intentCode: 'medicationYes' },
                        { text: 'No', intentCode: 'medicationNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing eye image', error);
            return this.error('There was an issue processing your image. Please try again.');
        }
    }

    private normalizeToArray(value: any): string[] {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return [value];
    }
}

// ============================================
// 6. MEDICATION YES LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class MedicationYesListener extends BaseLLMListener {

    readonly intentCode = 'medicationYes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Medication adherence confirmed for user: ${event.userId}`);

        // Clear cache after conversation completion
        const cacheKey = `SymptomsStorage:${event.userId}`;
        await CacheMemory.delete(cacheKey);

        return this.success(
            'That\'s great to hear! Consistent medication is important for your recovery. ' +
            'Our team will review your case and reach out if needed. Take care!'
        );
    }
}

// ============================================
// 7. MEDICATION NO LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class MedicationNoListener extends BaseLLMListener {

    readonly intentCode = 'medicationNo';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Medication non-adherence reported for user: ${event.userId}`);

        // Clear cache after conversation completion
        const cacheKey = `SymptomsStorage:${event.userId}`;
        await CacheMemory.delete(cacheKey);

        return this.success(
            'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!'
        );
    }
}
