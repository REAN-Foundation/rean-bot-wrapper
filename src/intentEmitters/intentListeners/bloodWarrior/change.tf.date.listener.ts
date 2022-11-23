import { changeTransfusionDateService } from "../../../services/bloodWrrior/chnage.transfusion.date.service";

export const ChangeTransfusionDate = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await changeTransfusionDateService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
