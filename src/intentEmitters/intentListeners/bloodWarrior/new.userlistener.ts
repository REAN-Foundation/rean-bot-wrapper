import { NewUserService } from "../../../services/bloodWrrior/new.user.service";

export const BloodWarriorNewUser = async (intent, eventObj) => {
    const newUserService: NewUserService = eventObj.container.resolve(NewUserService);
    return new Promise(async (resolve,reject) => {
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
