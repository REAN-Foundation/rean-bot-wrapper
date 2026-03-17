import { Lifecycle, scoped } from 'tsyringe';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { CacheMemory } from '../../../services/cache.memory.service';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';

/**
 * Dialogflow Symptom Assessment Listeners
 *
 * Simple symptom flow using Dialogflow migrated intents:
 * - conditionIdentification (main entry)
 * - MoreSymptoms (additional symptoms)
 * - KerotoplastyFollowUp (followup/photo)
 * - eyeImage (photo submission)
 * - responseYes/responseNo (final responses)
 */

// ============================================
// 1. CONDITION IDENTIFICATION LISTENER (Main Entry Point)
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ConditionIdentificationListener extends BaseLLMListener {

    readonly intentCode = 'conditionIdentification';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing condition identification for user: ${event.userId}`);

        try {
            // Extract entities and normalize to arrays
            const dropInVision = this.normalizeToArray(this.getEntity(event, 'complexDropInVision'));
            const severePain = this.normalizeToArray(this.getEntity(event, 'complexSeverePain'));
            const normalSymptoms = this.normalizeToArray(this.getEntity(event, 'complexNormalSymptoms'));
            const medicalRecordNumber = this.normalizeToArray(this.getEntity(event, 'medicalRecordNumber'));

            // Combine all symptoms
            const allSymptoms = [...dropInVision, ...severePain, ...normalSymptoms];

            this.log(`Symptoms extracted: ${allSymptoms.join(', ')}`);

            // Simple risk assessment
            const { priority, message } = this.assessRisk(dropInVision, severePain);

            // Cache for multi-turn conversation
            const cacheKey = `SymptomAssessment:${event.userId}`;
            await this.cacheSymptomData(cacheKey, {
                priority,
                message,
                symptoms            : allSymptoms,
                medicalRecordNumber : medicalRecordNumber.length > 0 ? medicalRecordNumber[0] : null,
                timestamp           : new Date()
            });

            this.log(`Risk assessment: Priority ${priority}`);

            // Return response with buttons
            return {
                success : true,
                message : `${message}\n\nWould you like to report any other symptoms?`,
                data    : {
                    symptoms        : allSymptoms,
                    priority,
                    followUpButtons : [
                        { text: 'Yes, More Symptoms', type: 'intent', value: 'MoreSymptoms' },
                        { text: 'No, that\'s all', type: 'intent', value: 'KerotoplastyFollowUp' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing condition identification', error);
            return this.error('I apologize, but I encountered an issue processing your symptoms. Please try again.');
        }
    }

    /**
     * Simple risk assessment based on symptoms
     */
    private assessRisk(
        dropInVision: string[],
        severePain: string[]
    ): { priority: number; message: string } {

        const hasVisionLoss = dropInVision.length > 0 && dropInVision.some(v => v !== 'no' && v !== 'false');
        const hasSeverePain = severePain.length > 0 && severePain.some(v => v !== 'no' && v !== 'false');

        // Priority 1 (Emergency): Both severe pain AND vision loss
        if (hasSeverePain && hasVisionLoss) {
            return {
                priority : 1,
                message  : '⚠️ Your symptoms require immediate medical attention. You are experiencing both severe pain and vision loss. Please seek emergency care or contact us at 1800-200-2211.'
            };
        }

        // Priority 2 (Urgent): Either severe pain OR vision loss
        if (hasSeverePain || hasVisionLoss) {
            return {
                priority : 2,
                message  : 'Your symptoms need medical evaluation. We recommend scheduling an appointment soon or calling our helpline at 1800-200-2211.'
            };
        }

        // Priority 3 (Normal): Other symptoms
        return {
            priority : 3,
            message  : 'Thank you for sharing your symptoms. These are common post-operative occurrences. Continue your prescribed care.'
        };
    }

    private async cacheSymptomData(key: string, data: any): Promise<void> {
        try {
            await CacheMemory.set(key, data);
        } catch (error) {
            this.logError('Error caching symptom data', error);
        }
    }

    /**
     * Normalize entity value to array
     */
    private normalizeToArray(value: any): string[] {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    }
}

// ============================================
// 2. MORE SYMPTOMS LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class MoreSymptomsListener extends BaseLLMListener {

    readonly intentCode = 'MoreSymptoms';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing more symptoms for user: ${event.userId}`);

        try {
            // Extract new symptoms and normalize to array
            const newSymptoms = this.normalizeToArray(this.getEntity(event, 'symptoms'));

            if (newSymptoms.length === 0) {
                return this.success('Please describe any additional symptoms you\'re experiencing.');
            }

            // Retrieve cached data
            const cacheKey = `SymptomAssessment:${event.userId}`;
            const cachedData = await CacheMemory.get(cacheKey);

            const previousSymptoms = cachedData?.symptoms || [];
            const combinedSymptoms = [...previousSymptoms, ...newSymptoms];

            // SIMPLE RULE: If user reports MORE symptoms, override priority to 1 (Emergency)
            // Rationale: Situation is worse than initially stated
            const priority = 1;
            const message = 'Thank you for sharing the additional symptoms. Based on all your symptoms, this requires immediate medical attention.';

            this.log(`Additional symptoms reported. Overriding priority to ${priority}`);

            // Update cache
            await CacheMemory.set(cacheKey, {
                priority,
                message,
                symptoms            : combinedSymptoms,
                medicalRecordNumber : cachedData?.medicalRecordNumber,
                overridden          : true,
                timestamp           : new Date()
            });

            return {
                success : true,
                message : `${message}\n\n📸 Please share a photo of your operated eye so our experts can review and guide you further.`,
                data    : {
                    symptoms        : combinedSymptoms,
                    priority,
                    followUpButtons : [
                        { text: 'Send Photo', type: 'intent', value: 'eyeImage' },
                        { text: 'Skip Photo', type: 'intent', value: 'responseNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing more symptoms', error);
            return this.error('I apologize, but I encountered an issue. Please try again.');
        }
    }

    /**
     * Normalize entity value to array
     */
    private normalizeToArray(value: any): string[] {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    }
}

// ============================================
// 3. KERATOPLASTY FOLLOWUP LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class KeratoplastyFollowUpListener extends BaseLLMListener {

    readonly intentCode = 'KerotoplastyFollowUp';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing followup for user: ${event.userId}`);

        try {
            // Retrieve cached assessment
            const cacheKey = `SymptomAssessment:${event.userId}`;
            const cachedData = await CacheMemory.get(cacheKey);

            if (!cachedData) {
                return this.success('How can I assist you today?');
            }

            const { priority, message } = cachedData;

            // Use cached message or fallback
            const displayMessage = message || 'Thank you for providing your symptoms. Our team will review and get back to you.';

            return {
                success : true,
                message : `${displayMessage}\n\n📸 Please share a photo of your operated eye so our experts can review and guide you further.`,
                data    : {
                    priority,
                    followupComplete : true,
                    followUpButtons  : [
                        { text: 'Send Photo', type: 'intent', value: 'eyeImage' },
                        { text: 'Skip Photo', type: 'intent', value: 'responseNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing followup', error);
            return this.error('I apologize, but I encountered an issue. Please try again.');
        }
    }
}

// ============================================
// 4. EYE IMAGE LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class EyeImageListener extends BaseLLMListener {

    readonly intentCode = 'eyeImage';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing eye image for user: ${event.userId}`);

        try {
            // Extract image URL and medical record number and normalize to arrays
            const imageUrl = this.normalizeToArray(this.getEntity(event, 'imageUrl'));
            const medicalRecordNumber = this.normalizeToArray(this.getEntity(event, 'medicalRecordNumber'));

            if (imageUrl.length === 0) {
                return this.success('Please send a clear photo of the affected area of your eye. Make sure there\'s good lighting and the image is focused.');
            }

            // Retrieve cached symptom data
            const cacheKey = `SymptomAssessment:${event.userId}`;
            const cachedData = await CacheMemory.get(cacheKey);

            const recordNumber = medicalRecordNumber.length > 0
                ? medicalRecordNumber[0]
                : cachedData?.medicalRecordNumber;

            this.log(`Image received: ${imageUrl[0]}, Medical Record: ${recordNumber || 'N/A'}`);

            // TODO: Post to external system (ClickUp, backend, etc.)
            // This would be async like in keratoplasty listener
            // await this.postToExternalSystem(event, imageUrl[0], recordNumber, cachedData);

            return {
                success : true,
                message : 'We\'ve successfully received your photo. The *quality looks good* for further assessment.\n\nAre you taking your prescribed medications regularly?',
                data    : {
                    imageUrl            : imageUrl[0],
                    medicalRecordNumber : recordNumber,
                    imageReceived       : true,
                    followUpButtons     : [
                        { text: 'Yes', type: 'intent', value: 'responseYes' },
                        { text: 'No', type: 'intent', value: 'responseNo' }
                    ]
                }
            };

        } catch (error) {
            this.logError('Error processing eye image', error);
            return this.error('I apologize, but I encountered an issue processing your image. Please try again.');
        }
    }

    /**
     * Normalize entity value to array
     */
    private normalizeToArray(value: any): string[] {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    }
}

// ============================================
// 5. RESPONSE YES LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ResponseYesListener extends BaseLLMListener {

    readonly intentCode = 'responseYes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing affirmative response for user: ${event.userId}`);

        try {
            // Clear cache - conversation complete
            const cacheKey = `SymptomAssessment:${event.userId}`;
            await CacheMemory.delete(cacheKey);

            return this.success(
                'That\'s great to hear! Consistent medication is important for your recovery. ' +
                'Our team will review your case and reach out if needed. Take care!'
            );

        } catch (error) {
            this.logError('Error processing yes response', error);
            return this.error('Thank you.');
        }
    }
}

// ============================================
// 6. RESPONSE NO LISTENER
// ============================================
@scoped(Lifecycle.ContainerScoped)
export class ResponseNoListener extends BaseLLMListener {

    readonly intentCode = 'responseNo';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing negative response for user: ${event.userId}`);

        try {
            // Clear cache - conversation complete
            const cacheKey = `SymptomAssessment:${event.userId}`;
            await CacheMemory.delete(cacheKey);

            return this.success(
                'Thank you for the information. If you experience any changes or new symptoms, please don\'t hesitate to reach out. Take care!'
            );

        } catch (error) {
            this.logError('Error processing no response', error);
            return this.error('Thank you.');
        }
    }
}
