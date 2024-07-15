import { NewUserService } from "../../../services/bloodWrrior/new.user.service";

export const BloodWarriorNewUser = async (intent, eventObj) => {
    const newUserService: NewUserService = eventObj.container.resolve(NewUserService);
    try {
        let result = null;
        result = await newUserService.newUserService();
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
