import { CommonAssessmentService } from "../../../services/Assesssment/common.assessment.service.js";

export const CommonAssessmentListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const commonAssessmentService: CommonAssessmentService = eventObj.container.resolve(CommonAssessmentService);
    try {
        let result = null;
        const intentName = intent;
        const assessmentCode = getAssessmentDisplayCode(intentName);
        result = await commonAssessmentService.triggerAssessment(eventObj, assessmentCode);
        console.log(`assessment service log ${result}`);
        return result;

    } catch (error) {
        console.log(error);
    }
};

export const getAssessmentDisplayCode = (intentName) => {
    const message = {
        "NoBabyMovement"          : "AssessmentNoBaby",
        "AssessmentBloodPressure" : "AssessmentBloodPressure",
        "AssessmentRegistration"  : "AssessmentRegistration",
        "Reminder_Reply_No"       : "AppointmentFollowUp",
        "start_assessment_quiz"   : "ADUNUTESTASSESSMENT"
    };
    return message[intentName] ?? "";
};
