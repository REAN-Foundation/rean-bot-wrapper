import { ChecklistDateValidationService } from "../../../services/bloodWrrior/checklist.date.validation.service";
const checklistDateValidation = new ChecklistDateValidationService();

export const ChecklistDateValidation = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
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
