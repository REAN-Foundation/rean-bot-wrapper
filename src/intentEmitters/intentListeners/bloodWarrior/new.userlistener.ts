import { container } from "tsyringe";
import { NewUserService } from "../../../services/bloodWrrior/new.user.service";
const newUserService: NewUserService = container.resolve(NewUserService);

export const BloodWarriorNewUser = async (intent, eventObj) => {
    return new Promise(async (resolve) => {
        try {
            let result = null;
            result = await newUserService.newUserService(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
