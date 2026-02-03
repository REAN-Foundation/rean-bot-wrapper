import { scoped, Lifecycle, inject } from 'tsyringe';
import needle from 'needle';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { ClientEnvironmentProviderService } from '../../../services/set.client/client.environment.provider.service';
import { GetHeaders } from '../../../services/biometrics/get.headers';
import { Logger } from '../../../common/logger';

/**
 * LLM-native Blood Glucose Listener
 *
 * Handles blood glucose creation without Dialogflow dependencies.
 * Works with both direct LLM classification and entity collection flows.
 *
 * Expected entities:
 * - BloodGlucose_Amount (required): The glucose reading value
 * - BloodGlucose_unit (optional): Unit of measurement (mg/dL or mmol/L)
 */
@scoped(Lifecycle.ContainerScoped)
export class BloodGlucoseListener extends BaseLLMListener {
    
    readonly intentCode = 'blood.glucose.create';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing blood glucose creation for user: ${event.userId}`);

        try {

            // Get services from container
            const clientEnvService = this.resolve(event, ClientEnvironmentProviderService);
            const getHeaders = this.resolve(event, GetHeaders);

            // Extract entities
            const glucoseValue = this.getEntity<number>(event, 'BloodGlucose_Amount');
            let glucoseUnit = this.getEntity<string>(event, 'BloodGlucose_unit', '');

            // Validate required entity
            if (!glucoseValue) {
                this.log('Missing required entity: BloodGlucose_Amount');
                return this.error('Please provide your blood glucose reading.');
            }

            // Default unit if not provided
            let unitMessage = '';
            if (!glucoseUnit || glucoseUnit === '') {
                glucoseUnit = 'mg/dL';
                unitMessage = 'Blood glucose unit assumed to mg/dL. ';
            }
            return this.success(`Your recorded blood glucose value is: ${glucoseValue} ${glucoseUnit}`, {
            });

            // Get patient info using phone number from event
            const phoneNumber = this.formatPhoneNumber(event.userId);
            const patientInfo = await this.getPatientByPhone(phoneNumber, clientEnvService, getHeaders);

            if (!patientInfo) {
                return this.error('Unable to find your patient profile. Please ensure you are registered.');
            }

            const { patientUserId, accessToken } = patientInfo;

            // Create blood glucose record
            const ReanBackendBaseUrl = clientEnvService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
            const apiUrl = `${ReanBackendBaseUrl}clinical/biometrics/blood-glucose`;
            const options = getHeaders.getHeaders(accessToken);

            const payload = {
                PatientUserId : patientUserId,
                BloodGlucose  : glucoseValue,
                Unit          : glucoseUnit,
                RecordDate    : new Date().toISOString()
            };

            this.log(`Creating blood glucose record: ${glucoseValue} ${glucoseUnit}`);
            const response = await needle('post', apiUrl, payload, options);

            if (response.statusCode !== 201) {
                this.logError(`API call failed with status ${response.statusCode}`);
                return this.error('Failed to record your blood glucose. Please try again.');
            }

            // Generate health remark
            const remark = this.getHealthRemark(glucoseValue);
            const recordedValue = response.body.Data.BloodGlucose.BloodGlucose;
            const recordedUnit = response.body.Data.BloodGlucose.Unit;

            const message = `${unitMessage}Your newly added blood glucose ${recordedValue} ${recordedUnit} is ${remark}`;

            this.log(`Blood glucose created successfully: ${recordedValue} ${recordedUnit}`);

            return this.success(message, {
                bloodGlucose  : recordedValue,
                unit          : recordedUnit,
                remark        : remark,
                patientUserId : patientUserId
            });

        } catch (error) {
            this.logError('Error creating blood glucose record', error);
            return this.error('An error occurred while recording your blood glucose. Please try again.');
        }
    }

    /**
     * Get health remark based on blood glucose value
     */
    private getHealthRemark(bloodGlucose: number): string {
        if (bloodGlucose < 53) {
            return 'very low. Please consult your doctor.';
        } else if (bloodGlucose < 70) {
            return 'low. We suggest please continue home monitoring.';
        } else if (bloodGlucose < 125) {
            return 'in normal range. Stay healthy!';
        } else if (bloodGlucose < 200) {
            return 'high. Please consult your Doctor.';
        } else {
            return 'very high. Please consult your Doctor.';
        }
    }

    /**
     * Format phone number for API lookup
     */
    private formatPhoneNumber(platformId: string): string {
        let phoneNumber = platformId;

        // Add + prefix if needed
        if (phoneNumber.length > 10 && !phoneNumber.includes('+')) {
            phoneNumber = '+' + phoneNumber;
        }

        // Format with country code separator
        const tenDigit = phoneNumber.slice(-10);
        const countryCode = phoneNumber.split(tenDigit)[0];
        if (phoneNumber.length > 10 && !phoneNumber.includes('-')) {
            phoneNumber = `${countryCode}-${tenDigit}`;
        }

        return phoneNumber;
    }

    /**
     * Get patient info by phone number
     */
    private async getPatientByPhone(
        phoneNumber: string,
        clientEnvService: ClientEnvironmentProviderService,
        getHeaders: GetHeaders
    ): Promise<{ patientUserId: string; accessToken: string } | null> {
        try {
            const options = getHeaders.getHeaders();
            const ReanBackendBaseUrl = clientEnvService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
            const apiUrl = `${ReanBackendBaseUrl}patients/byPhone?phone=${encodeURIComponent(phoneNumber)}`;

            this.log(`Looking up patient by phone: ${phoneNumber}`);
            const response = await needle('get', apiUrl, options);

            if (response.statusCode !== 200 || !response.body.Data?.Patients?.length) {
                this.log(`No patient found for phone: ${phoneNumber}`);
                return null;
            }

            const patient = response.body.Data.Patients[0];
            return {
                patientUserId : patient.UserId,
                accessToken   : patient.accessToken
            };
        } catch (error) {
            this.logError('Error looking up patient', error);
            return null;
        }
    }
}
