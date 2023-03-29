import { RegisterAllProfileService } from "../../../services/bloodWrrior/register.all.profile.service";

export const RegisterAllProfileListener = async (intent, eventObj) => {
    const registerAllProfileService: RegisterAllProfileService = eventObj.container.resolve(RegisterAllProfileService);
    try {
        let result = null;
        result = await registerAllProfileService.sendUserMessage(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
