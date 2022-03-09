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
        const array = eventObj.body.queryResult.parameters.array;
        console.log('the array given by user///', array);

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
        let url = `${ReanBackendBaseUrl}clinical/symptom-assessment-templates/7cc55f8a-3b68-407f-a660-b3dbffd11875`;

        const resp = await needle('get', url, options);
        
        //create symptom assessment for patient
        url = `${ReanBackendBaseUrl}clinical/symptom-assessments`;
        const obj = {
            PatientUserId        : patientUserId,
            AssessmentTemplateId : '7cc55f8a-3b68-407f-a660-b3dbffd11875',
            AssessmentDate       : Date(),
            Title                : '7cc55f8a-3b68-407f-a660-b3dbffd11875',
        };
        const resp1 = await needle('post', url, obj, options);
        const assessmentId = resp1.body.Data.SymptomAssessment.id;

        for (const c of array) {
            const symptomTypeId = resp.body.Data.SymptomAssessmentTemplate.TemplateSymptomTypes[c - 1].SymptomTypeId;
            const symptom = resp.body.Data.SymptomAssessmentTemplate.TemplateSymptomTypes[c - 1].Symptom;
            console.log(`symptom selected by user ${symptom}`);
            
            //create symptom
            const url2 = `${ReanBackendBaseUrl}clinical/symptoms`;
            const obj2 = {
                PatientUserId  : patientUserId,
                AssessmentId   : assessmentId,
                SymptomTypeId  : symptomTypeId,
                IsPresent      : true,
                Severity       : 1,
                Status         : 1,
                Interpretation : 1,
            };
            
            const resp2 = await needle('post', url2, obj2, options);
            
            if (resp2.statusCode !== 201) {
                throw new Error('Failed to get response from API.');
            }
            console.log(`status code of ${c} is ${resp2.statusCode}`);

        }

        const dffMessage = `Symptoms recorded successfully.`;

        const data = { fulfillmentMessages: [{ text: { text: [dffMessage] } }] };
        return { sendDff: true, message: data };
    } else {
        throw new Error(`500, How do you feel worse Info Service Error!`);
    }
};

