import { Gender } from "../../refactor/messageTypes/user.info.types";

export interface UserInfoDto {
    autoIncrementalID?: number;
    userID: number;
    userPlatformID: string;
    userName?: string;
    userAge?: number;
    userGender?: Gender;
    userInfo?: string;
    infoProvided?: boolean;
}
