import { Logger } from '../common/logger';
import { IntentEmitter } from './intent.emitter';

// Register All listener handlers
import { getVaccinationAppointments, secondListener } from './intentListeners/vaccination.listener';
import { getCovidInfo1s, getCovidResources1s } from './intentListeners/covid.listener';
import { handleIntentFufillmentError } from './intentListeners/fallback.listener';
import { getSymptomAssessment } from './intentListeners/symptom.listener';
import { RiskAssessmentListener } from './intentListeners/risk.assessment.listener';
import { getRiskAssessmentInfo } from './intentListeners/risk.assessment.info.listener';
import { getRiskAssessmentFollowup } from './intentListeners/risk.assessment.followup.listener';
import { getMedicationInfo } from './intentListeners/support.app.listener';
import { AppSupportListener } from './intentListeners/app.support.listener';
import { AppSymptomListener } from './intentListeners/app.symptom.listener';
import { getGenericpedia, getGenericpediaChemist } from './intentListeners/genericpedia.listener';

/*
 * Init function (being called during application bootstrap)
 * This is the place to register any new intent and corresponding listeners
 * ** One Intent can have multiple Listeners
 * ** Listener functions are further modulerised in "./intentListeners" based on context
*/
export class IntentRegister {

    register(){
        Logger.instance().log("Begin registering Intents...");

        IntentEmitter.registerListener('Vaccination.AppointmentAvailability', getVaccinationAppointments);
        IntentEmitter.registerListener('vaccination:appointments', secondListener);

        IntentEmitter.registerListener('covid-info', getCovidInfo1s);

        IntentEmitter.registerListener('covid-resources', getCovidResources1s);

        IntentEmitter.registerListener('life - no', getSymptomAssessment);

        IntentEmitter.registerListener('Risk.Assessment', RiskAssessmentListener);

        IntentEmitter.registerListener('Risk.assessment.info', getRiskAssessmentInfo);
        IntentEmitter.registerListener('risk.assessment.info-no', getRiskAssessmentInfo);

        IntentEmitter.registerListener('diabetes', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('cancer', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('heart', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('immunosuppressant', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('kidney', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('liver', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('lungs', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('pregnancy', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('genericpedia', getGenericpedia);
        IntentEmitter.registerListener('genericpedia location', getGenericpediaChemist);

        IntentEmitter.registerListener('SupportApp.GetMedication', getMedicationInfo);
        IntentEmitter.registerListener('BloodGlucose.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BloodGlucose.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BloodPressure.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BloodPressure.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BodyHeight.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BodyHeight.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('Weight.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('Weight.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BodyTemperature.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BodyTemperature.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BloodOxygenSaturation.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('BloodOxygenSaturation.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('Pulse.update', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('Pulse.Create', AppSupportListener.handleIntent);
        IntentEmitter.registerListener('HowYouFeel - Better', AppSymptomListener.handleIntent);
        IntentEmitter.registerListener('HowYouFeel - same', AppSymptomListener.handleIntent);
        IntentEmitter.registerListener('HowYouFeel - worse', AppSymptomListener.handleIntent);
        IntentEmitter.registerListener('HowYouFeel - worse - custom', AppSymptomListener.handleIntent);
    
        // Intent Failure/fallback listener
        IntentEmitter.registerListener('IntentFulfillment:Failure', handleIntentFufillmentError);

        // Intent fulfillement - Success listener
        // TODO: Pending implementation
        // eslint-disable-next-line max-len
        // IntentEmitter.registerListener('IntentFulfillment:Success', () => { Logger.instance().log("Intent fulfilled successfully."); return true; });
        IntentEmitter.registerListener('IntentFulfillment:Success', this.logSuccessfulIntent);

        Logger.instance().log("Intent registration completed...");
    }

    logSuccessfulIntent (){
        Logger.instance().log("Intent fulfilled successfully.");
        return true;
    }

}
