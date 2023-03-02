import { RegisterAllProfileService } from "../../../services/bloodWrrior/register.all.profile.service";

const registerAllProfileService: RegisterAllProfileService = new RegisterAllProfileService();

export const RegisterAllProfileListener = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await registerAllProfileService.sendUserMessage(eventObj);
            console.log(result);
            resolve(result.message);

        } catch (error) {
            console.log(error);
        }
    });
};
