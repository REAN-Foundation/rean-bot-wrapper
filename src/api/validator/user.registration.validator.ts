import { UserDetailsDomainModel } from "../../domain.types/userAction/user.enrollment.domain.models";
import { CareplanEnrollmentDomainModel } from "../../domain.types/userAction/user.enrollment.domain.models";
import { UserRegistrationDomainModel } from "../../domain.types/userAction/user.enrollment.domain.models";
import { Gender } from "../../refactor/messageTypes/user.info.types";
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

    validateUserRegistrationDetails = (request): { model: UserRegistrationDomainModel, errors: string[] } => {
        const body = request.body ?? {};
        const errors: string[] = [];

        if (!body.platform || typeof body.platform !== 'string') {
            errors.push("'platform' is required and must be a string");
        }
        if (body.platformUserId === undefined || body.platformUserId === null || String(body.platformUserId).trim() === '') {
            errors.push("'platformUserId' is required");
        }
        if (body.userName !== undefined && body.userName !== null && typeof body.userName !== 'string') {
            errors.push("'userName' must be a string");
        }

        let age: number = undefined;
        if (body.age !== undefined && body.age !== null && body.age !== '') {
            age = Number(body.age);
            if (!Number.isInteger(age) || age < 0 || age > 150) {
                errors.push("'age' must be an integer between 0 and 150");
            }
        }

        let gender: Gender = undefined;
        if (body.gender !== undefined && body.gender !== null && body.gender !== '') {
            const normalizedGender = String(body.gender).toLowerCase();
            if (!Object.values(Gender).includes(normalizedGender as Gender)) {
                errors.push(`'gender' must be one of: ${Object.values(Gender).join(', ')}`);
            }
            gender = normalizedGender as Gender;
        }

        const model: UserRegistrationDomainModel = {
            platform       : body.platform,
            platformUserId : body.platformUserId != null ? String(body.platformUserId).trim() : body.platformUserId,
            userName       : body.userName ?? undefined,
            age            : age,
            gender         : gender
        };
        return { model, errors };
    };

    validateCareplanEnrollmentDetails =(request): CareplanEnrollmentDomainModel =>{
        
        const careplanEnrollmentDetails : CareplanEnrollmentDomainModel = {
            platform : request.body.platform,
            lmpstr   : request.body.lmp
        };
        return careplanEnrollmentDetails;
    };

}
