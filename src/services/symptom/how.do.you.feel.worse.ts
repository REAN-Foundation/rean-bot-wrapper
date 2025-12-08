import { GetHeaders } from '../../services/biometrics/get.headers';
import { GetPatientInfoService } from '../../services/support.app.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import needle from 'needle';

@scoped(Lifecycle.ContainerScoped)
export class HowDoYouFeelWorseService {

    constructor(
        @inject(GetHeaders) private getHeaders: GetHeaders,
        @inject(GetPatientInfoService) private getPatientInfoService: GetPatientInfoService,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService
    ){}

    howDoFeelWorse2InfoService = async (eventObj) => {
        if (eventObj) {
            const symptomList = eventObj.body.queryResult.parameters.symptom;
            const state = eventObj.body.queryResult.parameters.state;

            if ((symptomList.length - state.length) > 0) {
                const diff = (symptomList.length - state.length);

                for (var i = 0; i < diff ; i++){
                    state.push(state[0]);
                }
            }

            let result = null;
            result = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);

            const patientUserId = result.message[0].UserId;
            const accessToken = result.message[0].accessToken;
            const options = this.getHeaders.getHeaders(accessToken);
            const ReanBackendBaseUrl = process.env.REAN_APP_BACKEND_BASE_URL;
            let url = `${ReanBackendBaseUrl}clinical/symptom-assessment-templates/search?title=heart`;

            const resp = await needle('get', url, options);
            const assessmentTemplateId = resp.body.Data.SymptomAssessmentTemplates.Items[0].id;

            //create symptom assessment for patient
            url = `${ReanBackendBaseUrl}clinical/symptom-assessments`;
            const obj = {
                PatientUserId        : patientUserId,
                AssessmentTemplateId : assessmentTemplateId,
                AssessmentDate       : Date(),
                Title                : 'Symptom recording',
            };
            const resp1 = await needle('post', url, obj, options);
            const assessmentId = resp1.body.Data.SymptomAssessment.id;

            symptomList.forEach(async (symptom, index) => {
                const sta = state[index];
                const len = resp.body.Data.SymptomAssessmentTemplates.Items[0].TemplateSymptomTypes.length;
                let symptomTypeId = '';
                for (var j = 0; j < len ; j++){
                    const symptomP = resp.body.Data.SymptomAssessmentTemplates.Items[0].TemplateSymptomTypes[j].Symptom;
                    if (symptomP.includes(symptom)){
                        symptomTypeId = resp.body.Data.SymptomAssessmentTemplates.Items[0].
                            TemplateSymptomTypes[j].SymptomTypeId;
                        break;
                    }
                }

                //create symptom
                url = `${ReanBackendBaseUrl}clinical/symptoms`;
                const obj1 = {
                    PatientUserId    : patientUserId,
                    AssessmentId     : assessmentId,
                    SymptomTypeId    : symptomTypeId,
                    IsPresent        : true,
                    Severity         : -1,
                    ValidationStatus : -1,
                    Interpretation   : 'worse',
                };
                if (sta === 'better') {
                    obj1.Severity = 1;
                    obj1.ValidationStatus = 1;
                    obj1.Interpretation = 'better';
                }
                const resp2 = await needle('post', url, obj1, options);

                if (resp2.statusCode !== 201) {
                    throw new Error('Failed to get response from API.');
                }
            });

            const dffMessage = `Your symptoms recorded successfully, Do you have other symptoms?`;

            return { sendDff: true, message: { fulfillmentMessages: [{ text: { text: [dffMessage] } }] } };
        } else {
            throw new Error(`500, How do you feel worse Info Service Error!`);
        }
    };

}
