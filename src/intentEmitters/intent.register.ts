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
import { AnemiaBotListener } from './intentListeners/anemia.bot.listener';
import { NegativeFeedbackListener } from './intentListeners/negative.feedabck.listener';
import { PositiveFeedbackListener } from './intentListeners/positive.feedback.listener';
import { AppMedicationListener } from './intentListeners/app.medication.listener';
import { ExampleAnemiaImageListener } from './intentListeners/example.anemia.image.listener';
import { LanguageChangeListener } from './intentListeners/language.change.listener';
import { HumanHandoverListener } from './intentListeners/human.handover.listener';
import { RequestLiveAgent } from './intentListeners/request.live.agent.listener';
import { createDemoBot } from './intentListeners/create.demo.bot.listener';
import { calorieDetection } from './intentListeners/calorie.detection.listener';
import { calorieReport } from './intentListeners/calorie.report.listener';
import { CalorieUpdate } from './intentListeners/calorie.update.listener';
import { WhatsAppTemplateOpting } from './intentListeners/whatsapp.tempalte.opting.listener';
import { eyeSymptomAssessment } from './intentListeners/eye.symptom.assesment.listener';
import { MaternityCareplanListener } from './intentListeners/maternity.careplan.listener';
import { BloodWarriorWelcome } from './intentListeners/bloodWarrior/welcome.listener';
import { BloodWarriorPatient } from './intentListeners/bloodWarrior/patient.listener';
import { BloodWarriorDonor } from './intentListeners/bloodWarrior/donor.listener';
import { BloodWarriorNewUser } from './intentListeners/bloodWarrior/new.userlistener';
import { BloodWarriorPatientEnroll } from './intentListeners/bloodWarrior/patient.enroll.listener';
import { ChangeTransfusionDate } from './intentListeners/bloodWarrior/change.tf.date.listener';
import { kerotoplastyConditionIdentificationListener} from './intentListeners/kerotoplasty.bot.condition.Identification.listener';
import { kerotoplastyLocationListener } from './intentListeners/kerotoplasty.find.nearest.location.listener';
import { BloodWarriorMenu } from './intentListeners/bloodWarrior/menu.listener';
import { RaiseBloodDonationRequest } from './intentListeners/bloodWarrior/raise.request.listener';
import { CustomWelcomeIntent } from './intentListeners/custom.welcome.listener';
import { CustomLanguageListener } from './intentListeners/custom.language.listener';
import { BloodWarriorVolunteer } from './intentListeners/bloodWarrior/volunteer.listener';
import { BloodBridgeStatusListener } from './intentListeners/bloodWarrior/blood.bridge.status.listener';

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

        IntentEmitter.registerListener('anemiaStart', ExampleAnemiaImageListener);

        IntentEmitter.registerListener('covid-resources', getCovidResources1s);

        IntentEmitter.registerListener('Custom Welcome Intent', CustomWelcomeIntent);
        IntentEmitter.registerListener('Custom Language - custom', CustomLanguageListener);
        IntentEmitter.registerListener('Change Language - custom', LanguageChangeListener);

        IntentEmitter.registerListener('life - no', getSymptomAssessment);

        IntentEmitter.registerListener('Risk.Assessment', RiskAssessmentListener);
        
        IntentEmitter.registerListener('anemiaInitialisation-followup', AnemiaBotListener);

        IntentEmitter.registerListener('NegativeFeedback', NegativeFeedbackListener);

        IntentEmitter.registerListener('PositiveFeedback', PositiveFeedbackListener);

        IntentEmitter.registerListener('NegativeFeedback-HumanHandOff-Yes', HumanHandoverListener);

        IntentEmitter.registerListener("RequestLiveAgent", RequestLiveAgent);

        IntentEmitter.registerListener("OptOut", WhatsAppTemplateOpting);

        IntentEmitter.registerListener("OptIn", WhatsAppTemplateOpting);
        
        IntentEmitter.registerListener('Risk.assessment.info', getRiskAssessmentInfo);
        IntentEmitter.registerListener('risk.assessment.info-no', getRiskAssessmentInfo);

        IntentEmitter.registerListener('create.demo.excel',createDemoBot);

        //Intents for calorie information
        IntentEmitter.registerListener('foodItemsDetails', calorieDetection);
        IntentEmitter.registerListener('calorie.report.creation', calorieReport);
        IntentEmitter.registerListener('CalorieNegativeFeedback - yes', CalorieUpdate);

        //Intents for Post Operative Eye Care Symptom tracking
        IntentEmitter.registerListener('userDetails', eyeSymptomAssessment);
        IntentEmitter.registerListener('DifficultLookingatLight',eyeSymptomAssessment);
        IntentEmitter.registerListener('DropInVision',eyeSymptomAssessment);
        IntentEmitter.registerListener('IncreasedRedness',eyeSymptomAssessment);
        IntentEmitter.registerListener('WateringFromOperatedEye',eyeSymptomAssessment);
        IntentEmitter.registerListener('whiteSpot',eyeSymptomAssessment);

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
        IntentEmitter.registerListener('HowYouFeel - worse - custom - worse', AppSymptomListener.handleIntent);
        IntentEmitter.registerListener('Medication.Add.InApp', AppMedicationListener.handleIntent);
        IntentEmitter.registerListener('Registration', MaternityCareplanListener.handleIntent );
        IntentEmitter.registerListener('RegistrationAgree', MaternityCareplanListener.handleEnrollIntent );
        IntentEmitter.registerListener('Welcome.BloodWarrior', BloodWarriorWelcome);
        IntentEmitter.registerListener('BloodWarrior_Patient', BloodWarriorPatient);
        IntentEmitter.registerListener('BloodWarrior_Donor', BloodWarriorDonor);
        IntentEmitter.registerListener('New_User', BloodWarriorNewUser);
        IntentEmitter.registerListener('Patient_Confirm', BloodWarriorPatientEnroll);
        IntentEmitter.registerListener('Change_TF_Date_Input', ChangeTransfusionDate);

        IntentEmitter.registerListener('conditionIdentification', kerotoplastyConditionIdentificationListener);
        IntentEmitter.registerListener('criticalCondition', kerotoplastyLocationListener);
        IntentEmitter.registerListener('hyperCriticalCondition', kerotoplastyLocationListener);
        IntentEmitter.registerListener('normalCondition', kerotoplastyLocationListener);
        IntentEmitter.registerListener('Menu', BloodWarriorMenu);
        IntentEmitter.registerListener('Raise_Request_Yes', RaiseBloodDonationRequest);
        IntentEmitter.registerListener('BloodWarrior_Volunteer', BloodWarriorVolunteer);
        IntentEmitter.registerListener('BloodBridgeStatus', BloodBridgeStatusListener);

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
