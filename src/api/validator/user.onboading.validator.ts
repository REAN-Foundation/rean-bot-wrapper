import { UserDetailsDomainModel } from "../../domain.types/userAction/user.onboading.domain.model";

export class UserDetailsValidator{

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {
    }

    getDomainModel = (request): UserDetailsDomainModel => {

        const userDetailsModel : UserDetailsDomainModel = {
            platform            : request.body.platform,
            phoneNumber         : request.body?.phoneNumber,
            userName            : request.body?.userName,
            registerUserFlag    : request.body?.registerUser,
            welcomeMessagesFlag : request.body?.sendWelcomeMessage,
            languageCode       : request.body?.languageCode
        };

        return userDetailsModel;
    };

}
