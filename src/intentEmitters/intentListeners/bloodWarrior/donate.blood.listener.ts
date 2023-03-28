import { DonateBloodService } from "../../../services/bloodWrrior/donate.blood.service";

export const DonateBloodListener = async (intent, eventObj) => {
    const donateBloodService: DonateBloodService = eventObj.container.resolve(DonateBloodService);
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await donateBloodService.DonateBlood(eventObj);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
