import { DonorService } from "../../../services/bloodWrrior/donor.service";

export const BloodWarriorDonor = async (intent, eventObj) => {
    const donorService: DonorService = eventObj.container.resolve(DonorService);
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await donorService.donorService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
