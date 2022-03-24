import { getHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from '../../services/support.app.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { container } from 'tsyringe';
import needle from 'needle';

const getPatientInfoService: GetPatientInfoService = container.resolve(GetPatientInfoService);

export const howDoFeelWorse2InfoService = async (eventObj) => {
    if (eventObj) {
        const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(
            ClientEnvironmentProviderService
        );
        const phoneNumber = eventObj.body.queryResult.parameters.PhoneNumber;
        const symptomList = eventObj.body.queryResult.parameters.symptom;
        const state = eventObj.body.queryResult.parameters.state;

        if (!phoneNumber) {
            throw new Error('Missing required parameter PhoneNumber ');
        }
        let result = null;
        result = await getPatientInfoService.getPatientsByPhoneNumberservice(phoneNumber);

        const patientUserId = result.message[0].UserId;
        const accessToken = result.message[0].accessToken;
        const options = getHeaders(accessToken);
        const ReanBackendBaseUrl =
            clientEnvironmentProviderService.getClientEnvironmentVariable('REAN_APP_BACKEND_BASE_URL');
        let url = `${ReanBackendBaseUrl}clinical/symptom-assessment-templates/search?title=heart`;

        const resp = await needle('get', url, options);
        const assessmentTemplateId = resp.body.Data.SymptomAssessmentTemplates.Items[0].id;

        //create symptom assessment for patient
        url = `${ReanBackendBaseUrl}clinical/symptom-assessments`;
        const obj = {
            PatientUserId        : patientUserId,
            AssessmentTemplateId : assessmentTemplateId,
            AssessmentDate       : Date(),
            Title                : assessmentTemplateId,
        };
        const resp1 = await needle('post', url, obj, options);
        const assessmentId = resp1.body.Data.SymptomAssessment.id;
      
        const dict = new Map<string, number>();
        const array = ['tingling','weight gain','swelling','frequent urination','extreme thirst',
            'nausea','extreme fatigue','pain','cough','shortness of breath','dizziness','trouble sleeping'];
        let i = 1;
        for (const word of array) {
            dict.set(word, i);
            i = i + 1;
        }

        for (const symptom of symptomList) {
            const a = dict.get(symptom);
            const symptomTypeId = resp.body.Data.SymptomAssessmentTemplates.
                Items[0].TemplateSymptomTypes[a-1].SymptomTypeId;
            
            //create symptom
            const url = `${ReanBackendBaseUrl}clinical/symptoms`;
            const obj = {
                PatientUserId  : patientUserId,
                AssessmentId   : assessmentId,
                SymptomTypeId  : symptomTypeId,
                IsPresent      : true,
                Severity       : -1,
                Status         : -1,
                Interpretation : 1,
            };
            if (state === 'better') {
                obj.Severity = 1;
                obj.Status = 1;
            }
            const resp2 = await needle('post', url, obj, options);
            
            if (resp2.statusCode !== 201) {
                throw new Error('Failed to get response from API.');
            }
        }

        const dffMessage = `Your symptoms recorded successfully, Do you have other symptoms?`;

        return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
    } else {
        throw new Error(`500, How do you feel worse Info Service Error!`);
    }
};

