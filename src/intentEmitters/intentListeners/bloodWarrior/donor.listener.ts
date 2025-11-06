import { DonorService } from "../../../services/bloodWrrior/donor.service.js";

export const BloodWarriorDonor = async (intent, eventObj) => {
    const donorService: DonorService = eventObj.container.resolve(DonorService);
    try {
        let result = null;
        result = await donorService.donorService(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
