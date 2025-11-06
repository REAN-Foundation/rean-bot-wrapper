import type { UserDetailsDomainModel, CareplanEnrollmentDomainModel } from "../../domain.types/userAction/user.enrollment.domain.models.js";
export class UserDetailsValidator{

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {
    }

    validateUserDetails = (request): UserDetailsDomainModel => {

        const userDetailsModel : UserDetailsDomainModel = {
            platform     : request.body.platform,
            phoneNumber  : request.body.phoneNumber,
            userName     : request.body?.userName,
            languageCode : request.body?.languageCode

        };
        return userDetailsModel;
    };

    validateCareplanEnrollmentDetails = (request): CareplanEnrollmentDomainModel =>{

        const careplanEnrollmentDetails : CareplanEnrollmentDomainModel = {
            platform : request.body.platform,
            lmpstr   : request.body.lmp
        };
        return careplanEnrollmentDetails;
    };

}
