import { Logger } from '../common/logger';
import { IntentEmitter } from './intent.emitter';

// Register All listener handlers

// import { getVaccinationAppointments, secondListener } from './intentListeners/vaccination.listener';
import { getCovidInfo1s, getCovidResources1s } from './intentListeners/covid.listener';
import { handleIntentFufillmentError } from './intentListeners/fallback.listener';
import { getSymptomAssessment } from './intentListeners/symptom.listener';
import { RiskAssessmentListener } from './intentListeners/risk.assessment.listener';
import { getRiskAssessmentInfo } from './intentListeners/risk.assessment.info.listener';
import { getRiskAssessmentFollowup } from './intentListeners/risk.assessment.followup.listener';
import { getMedicationInfo } from './intentListeners/support.app.listener';
import { AppSupportListener } from './intentListeners/app.support.listener';
import { AppSymptomListener } from './intentListeners/app.symptom.listener';
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
import { CalorieUpdate } from './intentListeners/calorie.update.listener';
import { WhatsAppTemplateOpting } from './intentListeners/whatsapp.tempalte.opting.listener';
import { MaternityCareplanListener } from './intentListeners/maternity.careplan.listener';
import { BloodWarriorWelcome } from './intentListeners/bloodWarrior/welcome.listener';
import { BloodWarriorPatient } from './intentListeners/bloodWarrior/patient.listener';
import { BloodWarriorDonor } from './intentListeners/bloodWarrior/donor.listener';
import { BloodWarriorNewUser } from './intentListeners/bloodWarrior/new.userlistener';
import { BloodWarriorPatientEnroll } from './intentListeners/bloodWarrior/patient.enroll.listener';
import { ChangeTransfusionDate, GiveTransfusionDate, VolunteerChangeTransfusionDate } from './intentListeners/bloodWarrior/change.tf.date.listener';
import { kerotoplastyConditionIdentificationListener } from './intentListeners/kerotoplasty.bot.condition.Identification.listener';
import { kerotoplastyEyeQualityListener } from './intentListeners/kerotoplasty.imageQuality.listener';
import { BloodWarriorMenu } from './intentListeners/bloodWarrior/menu.listener';
import { RaiseBloodDonationRequest } from './intentListeners/bloodWarrior/raise.request.listener';
import { CustomWelcomeIntent } from './intentListeners/custom.welcome.listener';
import { CustomLanguageListener } from './intentListeners/custom.language.listener';
import { BloodWarriorVolunteer } from './intentListeners/bloodWarrior/volunteer.listener';
import { BloodBridgeStatusListener } from './intentListeners/bloodWarrior/blood.bridge.status.listener';
import { ChecklistDateValidation } from './intentListeners/bloodWarrior/checklist.date.validation.listener';
import { RejectDonorRequest } from './intentListeners/bloodWarrior/reject.donor.request.listener';
import { ScheduleDonation } from './intentListeners/bloodWarrior/schedule.donation.listener';
import { VerifyBloodBridge } from './intentListeners/bloodWarrior/Verify.bridge.listener';
import { ScheduleDonationElligible } from './intentListeners/bloodWarrior/schedule.donation.eligible.listener';
import { ScheduleDonationTakeValues } from './intentListeners/bloodWarrior/schedule.donation.take.values.listener';
import { DonationRequestYesListener } from './intentListeners/bloodWarrior/donation.request.yes.listener';
import { AcceptVolunteerRequestListener } from './intentListeners/bloodWarrior/accept.volunteer.request.listener';
import { AcceptDonationRequestListener } from './intentListeners/bloodWarrior/accept.donation.request.listener';
import { SelectBloodGroupListener } from './intentListeners/bloodWarrior/select.blood.group.listener';
import { DonateBloodListener } from './intentListeners/bloodWarrior/donate.blood.listener';
import { ScheduleOneTimeTakeValuesListener } from './intentListeners/bloodWarrior/schedule.one.time.take.values.listener';
import { RegisterAllProfileListener } from './intentListeners/bloodWarrior/register.all.profile.listener';
import { RaiseRequestNoNotifyVolunteer } from './intentListeners/bloodWarrior/raise.request.no.listener';
import { FeelingUnwellNotifyVolunteer } from './intentListeners/bloodWarrior/feeling.unwell.noyify.volunteer.listener';
import { OpenAiListener } from './intentListeners/openAi.listener';
import { GetNutritionalValue } from './intentListeners/get.nutritional.value.listener';
import { NeedBloodListener } from './intentListeners/bloodWarrior/need.blood.listener';
import { NeedBloodPatientYesListener } from './intentListeners/bloodWarrior/need.blood.patient.yes.listener';
import { CreateReminderListener } from './intentListeners/medicationReminder/create.reminder.listener';
import { GenerateCertificateListener } from './intentListeners/bloodWarrior/generate.certificate.flow.listener';
import { GenerateCertificateYesListener } from './intentListeners/bloodWarrior/generate.certificate.yes.listener';
import { GenerateCertificateConfirmYesListener } from './intentListeners/bloodWarrior/generate.certificate.confirm.yes.listener';
import { GeneralReminderListener } from './intentListeners/medicationReminder/general.reminder.listener';
import { ReminderFrequencyListener, SendFrequencyButtonsListener, StopMedicationReasonListener } from './intentListeners/medicationReminder/reminder.ask.frequency.listener';
import { ReminderAskTimeListener } from './intentListeners/medicationReminder/reminder.ask.time.listener';
import { AssessmentAnswerYesListener } from './intentListeners/assessment/assessment.answer.yes.listener';
import { RegistrationPerMinuteMsgListener } from './intentListeners/maternity.careplan/regstration.per.minute.listener';
import { AssessmentAnswerNoListener } from './intentListeners/assessment/assessment.answer.no.listener';
import { eyeImageQualityCheckListener } from './intentListeners/eye.image.quality.check.listener';
import { AppointmentReminderListener, AppointmentReminderReplyListener } from './intentListeners/medicationReminder/appointment.reminder.listener';
import { ReminderRegistrationListener } from './intentListeners/medicationReminder/reminder.registration.listener';
import { CommonAssessmentListener } from './intentListeners/assessment/common.assessment.listener';
import { ConsentYesListner } from './intentListeners/consentListners/consent.yes.listner';
import { DeleteReminderListener } from './intentListeners/medicationReminder/delete.reminder.listener';
import { CincinnatiPerMinuteMsgListener } from './intentListeners/maternity.careplan/cincinnati.per.minute.listener copy';
import { PatientDonationConfirmationListener } from './intentListeners/bloodWarrior/patient.donation.confirmation.listener';
import { AdditionalInfoEditListener } from './intentListeners/consentListners/get.additional.info.listener';
import { AdditionalInfoReadListener } from './intentListeners/consentListners/read.additional.info.listener';
import { WelcomeIntentListener } from './intentListeners/welcome.intent.listener';
import { NearestLocationListner } from './intentListeners/nearest.location.listner';
import { AppointmentBookingListner } from './intentListeners/appoinment.booking.listner';
import { VolunteerSelectedPatient } from './intentListeners/bloodWarrior/volunteer.selected.patient';
import { InitiateDeleteReminderListener, GetReminderDetails, DeleteReminder } from './intentListeners/initiate.delete.reminder.listener';
import { EnrollHFCareplanListener, SentRegistrationMSGListener } from './intentListeners/heartFailureCareplan/start.careplan.listener';
import { AssessmentScoringListener } from './intentListeners/assessment/assessemnt.quiz.scoring.listener';
import { UserInfoListener } from './intentListeners/user.info.listener';
/*
 * Init function (being called during application bootstrap)
 * This is the place to register any new intent and corresponding listeners
 * ** One Intent can have multiple Listeners
 * ** Listener functions are further modulerised in "./intentListeners" based on context
*/

export class IntentRegister {

    register(){
        Logger.instance().log("Begin registering Intents...");

        // IntentEmitter.registerListener('Vaccination.AppointmentAvailability', getVaccinationAppointments);
        // IntentEmitter.registerListener('vaccination:appointments', secondListener);

        IntentEmitter.registerListener('covid-info', getCovidInfo1s);

        IntentEmitter.registerListener('anemiaStart', ExampleAnemiaImageListener);

        IntentEmitter.registerListener('covid-resources', getCovidResources1s);

        IntentEmitter.registerListener('Custom Welcome Intent', CustomWelcomeIntent);
        IntentEmitter.registerListener('Default Welcome Intent', WelcomeIntentListener);
        IntentEmitter.registerListener('Custom Language - custom', CustomLanguageListener);
        IntentEmitter.registerListener('Change Language', LanguageChangeListener);

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

        // IntentEmitter.registerListener('calorie.report.creation', calorieReport);
        IntentEmitter.registerListener('CalorieNegativeFeedback - yes', CalorieUpdate);

        //hybrid model
        IntentEmitter.registerListener('testing-hybrid',OpenAiListener);
        IntentEmitter.registerListener('get_nutritional_values',GetNutritionalValue);

        IntentEmitter.registerListener('diabetes', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('cancer', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('heart', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('immunosuppressant', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('kidney', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('liver', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('lungs', getRiskAssessmentFollowup);
        IntentEmitter.registerListener('pregnancy', getRiskAssessmentFollowup);

        // IntentEmitter.registerListener('genericpedia', getGenericpedia);
        // IntentEmitter.registerListener('genericpedia location', getGenericpediaChemist);
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
        
        //IntentEmitter.registerListener('RegistrationAgree', MaternityCareplanListener.handleEnrollIntent );

        IntentEmitter.registerListener('Welcome.BloodWarrior', BloodWarriorWelcome);
        IntentEmitter.registerListener('BloodWarrior_Patient', BloodWarriorPatient);
        IntentEmitter.registerListener('BloodWarrior_Donor', BloodWarriorDonor);
        IntentEmitter.registerListener('New_User', BloodWarriorNewUser);
        IntentEmitter.registerListener('Patient_Confirm', BloodWarriorPatientEnroll);
        IntentEmitter.registerListener('Change_TF_Date_Input', ChangeTransfusionDate);
        IntentEmitter.registerListener('appointment-followconditionIdentification', kerotoplastyConditionIdentificationListener);
        IntentEmitter.registerListener('conditionIdentification', kerotoplastyConditionIdentificationListener);
        IntentEmitter.registerListener('eyeImage', kerotoplastyEyeQualityListener);
        IntentEmitter.registerListener('Menu', BloodWarriorMenu);
        IntentEmitter.registerListener('Raise_Request_Yes', RaiseBloodDonationRequest);
        IntentEmitter.registerListener('Raise_Request_No', RaiseRequestNoNotifyVolunteer);
        IntentEmitter.registerListener('BloodWarrior_Volunteer', BloodWarriorVolunteer);
        IntentEmitter.registerListener('BloodBridgeStatus', BloodBridgeStatusListener);
        IntentEmitter.registerListener('Checklist_Yes_Date', ChecklistDateValidation);
        IntentEmitter.registerListener('Reject_Donation_Request', RejectDonorRequest);
        IntentEmitter.registerListener('Checklist_No', RejectDonorRequest);
        IntentEmitter.registerListener('Schedule_Donation', ScheduleDonation);
        IntentEmitter.registerListener('Schedule_Donation_Eligibity', ScheduleDonationElligible);
        IntentEmitter.registerListener('Blood_Bridge_Verify', VerifyBloodBridge);
        IntentEmitter.registerListener('Blood_Bridge_Verify_Take_Values', ScheduleDonationTakeValues);
        IntentEmitter.registerListener('Donation_Request_BloodBridge', BloodBridgeStatusListener);
        IntentEmitter.registerListener('Donation_Request_Yes', DonationRequestYesListener);
        IntentEmitter.registerListener('Accept_Volunteer_Request', AcceptVolunteerRequestListener);
        IntentEmitter.registerListener('Accept_Donation_Request', AcceptDonationRequestListener);
        IntentEmitter.registerListener('O_Positive', SelectBloodGroupListener);
        IntentEmitter.registerListener('A_Positive', SelectBloodGroupListener);
        IntentEmitter.registerListener('B_Positive', SelectBloodGroupListener);
        IntentEmitter.registerListener('AB_Positive', SelectBloodGroupListener);
        IntentEmitter.registerListener('O_Negative', SelectBloodGroupListener);
        IntentEmitter.registerListener('A_Negative', SelectBloodGroupListener);
        IntentEmitter.registerListener('B_Negative', SelectBloodGroupListener);
        IntentEmitter.registerListener('AB_Negative', SelectBloodGroupListener);
        IntentEmitter.registerListener('Donate_Blood', DonateBloodListener);
        IntentEmitter.registerListener('Blood_OneTime_Take_Values', ScheduleOneTimeTakeValuesListener);
        IntentEmitter.registerListener('Send_OneTimeDonor', SelectBloodGroupListener);
        IntentEmitter.registerListener('Register_Volunteer', RegisterAllProfileListener);
        IntentEmitter.registerListener('Feeling_Unwell', FeelingUnwellNotifyVolunteer);
        IntentEmitter.registerListener('Need_Blood', NeedBloodListener);
        IntentEmitter.registerListener('NeedBlood_Patient_Confirm_Yes', NeedBloodPatientYesListener);
        IntentEmitter.registerListener('M_Medication_Data_Demo_Yes', CreateReminderListener);
        IntentEmitter.registerListener('Get_Transfusion_Date', GiveTransfusionDate);
        IntentEmitter.registerListener('Generate_Certificate', GenerateCertificateListener);
        IntentEmitter.registerListener('Generate_Certificate_Yes', GenerateCertificateYesListener);
        IntentEmitter.registerListener('Generate_Certificate_Confirm_Yes', GenerateCertificateConfirmYesListener);
        IntentEmitter.registerListener('General_Reminder', GeneralReminderListener);
        IntentEmitter.registerListener('Reminder_Ask_Time', ReminderAskTimeListener);
        IntentEmitter.registerListener('Dmc_Yes', AssessmentAnswerYesListener);
        IntentEmitter.registerListener('Dmc_No', AssessmentAnswerNoListener);
        IntentEmitter.registerListener('option_A',  AssessmentScoringListener);
        IntentEmitter.registerListener('option_B', AssessmentScoringListener);
        IntentEmitter.registerListener('option_C', AssessmentScoringListener);
        IntentEmitter.registerListener('option_D', AssessmentScoringListener);
        IntentEmitter.registerListener('Registration_PerMinMsg', RegistrationPerMinuteMsgListener);
        IntentEmitter.registerListener('Cincinnati_PerMinMsg', CincinnatiPerMinuteMsgListener);
        IntentEmitter.registerListener('ImageQualityCheck', eyeImageQualityCheckListener);
        IntentEmitter.registerListener('Appointment_Reminder', AppointmentReminderListener);
        IntentEmitter.registerListener('Reminder_Registration', ReminderRegistrationListener);
        IntentEmitter.registerListener('NoBabyMovement', CommonAssessmentListener);
        IntentEmitter.registerListener('AssessmentRegistration', CommonAssessmentListener);
        IntentEmitter.registerListener('AssessmentBloodPressure', CommonAssessmentListener);
        IntentEmitter.registerListener('Reminder_Reply_Yes', AppointmentReminderReplyListener);
        IntentEmitter.registerListener('Reminder_Reply_No', AppointmentReminderReplyListener);
        IntentEmitter.registerListener('Reminder_Reply_No', CommonAssessmentListener);
        IntentEmitter.registerListener('Reminder_Frequency_Once', ReminderFrequencyListener);
        IntentEmitter.registerListener('Reminder_Frequency_Daily', ReminderFrequencyListener);
        IntentEmitter.registerListener('Reminder_Frequency_Weekly', ReminderFrequencyListener);
        IntentEmitter.registerListener('Reminder_Ask_Frequency', SendFrequencyButtonsListener);
        IntentEmitter.registerListener('Medication_Stopped', StopMedicationReasonListener);
        IntentEmitter.registerListener('Reminder_Delete', DeleteReminderListener);
        IntentEmitter.registerListener('PatientDonationConfirmationYes', PatientDonationConfirmationListener.yesReply);
        IntentEmitter.registerListener('PatientDonationConfirmationNo', PatientDonationConfirmationListener.noReply);
        IntentEmitter.registerListener('Volunteer_Update_TF_Date', VolunteerChangeTransfusionDate);
        IntentEmitter.registerListener('Volunteer_Select_Patient', VolunteerSelectedPatient);

        IntentEmitter.registerListener('IntentFulfillment:Failure', handleIntentFufillmentError);
        IntentEmitter.registerListener('consent_yes', ConsentYesListner.handleIntent);
        IntentEmitter.registerListener('Cincinnati_PerMinMsg', CincinnatiPerMinuteMsgListener);
        IntentEmitter.registerListener('AdditionalInfo', AdditionalInfoEditListener);
        IntentEmitter.registerListener('readAdditionalInfo', AdditionalInfoReadListener);
        IntentEmitter.registerListener('findNearestLocation', NearestLocationListner);
        IntentEmitter.registerListener('Book Appoinment', AppointmentBookingListner);
        IntentEmitter.registerListener('HF_Send_Registration_Msg', SentRegistrationMSGListener);
        IntentEmitter.registerListener('Start_Careplan_HF', EnrollHFCareplanListener);
        IntentEmitter.registerListener('Work_Commitments', AssessmentAnswerNoListener);
        IntentEmitter.registerListener('Feeling_Unwell_A', AssessmentAnswerNoListener);
        IntentEmitter.registerListener('Transit_Issues', AssessmentAnswerNoListener);
        IntentEmitter.registerListener('Start_Careplan_HeartF_Select', EnrollHFCareplanListener);
        IntentEmitter.registerListener('Assessment_Yes', AssessmentAnswerYesListener);
        IntentEmitter.registerListener('Assessment_No', AssessmentAnswerNoListener);
        IntentEmitter.registerListener('start_assessment_quiz', CommonAssessmentListener);
        IntentEmitter.registerListener('initiate_delete_reminder', InitiateDeleteReminderListener);
        IntentEmitter.registerListener('delete_reminder_type', GetReminderDetails);
        IntentEmitter.registerListener('delete_reminder_time', DeleteReminder);
        IntentEmitter.registerListener('bookAppointment', AppointmentBookingListner);
        IntentEmitter.registerListener('Basic_assessment', CommonAssessmentListener);

        // Intents for Collecting user information
        IntentEmitter.registerListener('UserInfo', UserInfoListener);
      
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
