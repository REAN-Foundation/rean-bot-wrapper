import { ChecklistDateValidationService } from "../../../services/bloodWrrior/checklist.date.validation.service";

export const ChecklistDateValidation = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const checklistDateValidation: ChecklistDateValidationService = eventObj.container.resolve(ChecklistDateValidationService);
    try {
        let result = null;
        result = await checklistDateValidation.checklistDateValidationService(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
