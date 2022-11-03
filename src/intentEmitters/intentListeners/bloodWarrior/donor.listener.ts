import { container } from "tsyringe";
import { DonorService } from "../../../services/bloodWrrior/donor.service";
const donorService: DonorService = container.resolve(DonorService);

export const BloodWarriorDonor = async (intent, eventObj) => {
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
