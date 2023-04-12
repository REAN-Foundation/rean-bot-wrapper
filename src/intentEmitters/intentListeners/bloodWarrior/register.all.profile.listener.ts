import { RegisterAllProfileService } from "../../../services/bloodWrrior/register.all.profile.service";

const registerAllProfileService: RegisterAllProfileService = new RegisterAllProfileService();

export const RegisterAllProfileListener = async (intent, eventObj) => {
    try {
        let result = null;
        result = await registerAllProfileService.sendUserMessage(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
