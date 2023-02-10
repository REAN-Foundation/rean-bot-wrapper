import { DonateBloodService } from "../../../services/bloodWrrior/donate.blood.service";

export const DonateBloodListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await DonateBloodService(eventObj);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
