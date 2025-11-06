import { Gender } from '../messageTypes/user.info.types.js';

export interface IuserInfo {
    autoIncrementalID: number;
    userID: number;
    userPlatformID: string;
    userName?: string;
    userAge?: number;
    userGender?: Gender;
    infoProvided?: boolean;
}

export interface userInfoPayload {
    Name?: string;
    Age?: number;
    Gender?: Gender;
    Race?: string;
    Ethnicity?: string;
}
