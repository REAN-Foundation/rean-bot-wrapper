import { Logger } from '../common/logger';
import { IntentEmitter } from './IntentEmitter';

// Register All listener handlers
import { getVaccinationAppointments, secondListener } from './intentListeners/Vaccination.Listener';
import { getCovidInfo1s, getCovidResources1s } from './intentListeners/Covid.Listener';
import { handleIntentFufillmentError } from './intentListeners/Fallback.Listener';
import { getSymptomAssessment } from './intentListeners/Symptom.listener';
import { RiskAssessmentListener } from './intentListeners/RiskAssessment.Listener';
import { getRiskAssessmentInfo } from './intentListeners/RiskAssessmentInfo.Listener';
import { getRiskAssessmentFollowup } from './intentListeners/RiskAssessmentFollowup.Listener';
import { getMedicationInfo } from './intentListeners/SupportApp.Listener';
import { getGenericpedia, getGenericpediaChemist} from './intentListeners/Genericpedia.Listener'

/*
 * Init function (being called during application bootstrap)
 * This is the place to register any new intent and corresponding listeners
 * ** One Intent can have multiple Listeners
 * ** Listener functions are further modulerised in "./intentListeners" based on context
*/
export class IntentRegister {

    register(){
        Logger.instance().log("Begin registering Intents...")

        IntentEmitter.registerListener('Vaccination.AppointmentAvailability', getVaccinationAppointments)
        IntentEmitter.registerListener('vaccination:appointments', secondListener)

        IntentEmitter.registerListener('covid-info', getCovidInfo1s)

        IntentEmitter.registerListener('covid-resources', getCovidResources1s)

        IntentEmitter.registerListener('life - no', getSymptomAssessment)

        IntentEmitter.registerListener('Risk.Assessment', RiskAssessmentListener)

        IntentEmitter.registerListener('Risk.assessment.info', getRiskAssessmentInfo)
        IntentEmitter.registerListener('risk.assessment.info-no', getRiskAssessmentInfo)

        IntentEmitter.registerListener('diabetes', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('cancer', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('heart', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('immunosuppressant', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('kidney', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('liver', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('lungs', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('pregnancy', getRiskAssessmentFollowup)
        IntentEmitter.registerListener('genericpedia', getGenericpedia)
        IntentEmitter.registerListener('genericpedia location', getGenericpediaChemist)

        IntentEmitter.registerListener('SupportApp.GetMedication', getMedicationInfo)


        // Intent Failure/fallback listener
        IntentEmitter.registerListener('IntentFulfillment:Failure', handleIntentFufillmentError)

        // Intent fulfillement - Success listener
        // TODO: Pending implementation
        IntentEmitter.registerListener('IntentFulfillment:Success', () => { Logger.instance().log("Intent fulfilled successfully."); return true })

        Logger.instance().log("Intent registration completed...")
    }
}