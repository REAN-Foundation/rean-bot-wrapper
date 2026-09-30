import { Gender } from '../../refactor/messageTypes/user.info.types';

export interface UserDetailsDomainModel {
    platform : string,
    phoneNumber : string,
    userName: string,
    languageCode: string
}

export interface UserRegistrationDomainModel {
    platform       : string,
    platformUserId : string,
    userName?      : string,
    age?           : number,
    gender?        : Gender
}

export interface CareplanEnrollmentDomainModel {
    platform     : string,
    lmpstr          : string,
}
