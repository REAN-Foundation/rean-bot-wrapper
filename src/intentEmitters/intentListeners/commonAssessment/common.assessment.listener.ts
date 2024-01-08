import { NoBabyMovementAssessmentService } from "../../../services/commonAssesssment/common.assessment.service";

export const CommonAssessmentListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const noBabyMovementAssessmentService: NoBabyMovementAssessmentService = eventObj.container.resolve(NoBabyMovementAssessmentService);
    try {
        let result = null;
        const intentName = eventObj.body.queryResult.intent.displayName;
        const assessmentCode = getAssessmentDisplayCode(intentName);
        result = await noBabyMovementAssessmentService.createAssessment(eventObj, assessmentCode);
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
    };
    return message[intentName] ?? "";
};
