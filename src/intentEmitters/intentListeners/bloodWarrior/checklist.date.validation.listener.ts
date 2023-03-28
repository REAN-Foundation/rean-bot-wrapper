import { ChecklistDateValidationService } from "../../../services/bloodWrrior/checklist.date.validation.service";

export const ChecklistDateValidation = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const checklistDateValidation: ChecklistDateValidationService = eventObj.container.resolve(ChecklistDateValidationService);
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await checklistDateValidation.checklistDateValidationService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
