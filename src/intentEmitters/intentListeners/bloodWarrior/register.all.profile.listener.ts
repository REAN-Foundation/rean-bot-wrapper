import { RegisterAllProfileService } from "../../../services/bloodWrrior/register.all.profile.service";

const registerAllProfileService: RegisterAllProfileService = new RegisterAllProfileService();

export const RegisterAllProfileListener = async (intent, eventObj) => {
    try {
        let result = null;
        result = await registerAllProfileService.sendUserMessage(eventObj);
        console.log(result);
        return Promise.resolve(result.message)
            .then(async (eventObj) => {
                await registerAllProfileService.sendUserMessageAfter(eventObj);
            });

    } catch (error) {
        console.log(error);
    }
};
