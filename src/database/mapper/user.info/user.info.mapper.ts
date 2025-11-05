import { UserInfoDto } from "../../../domain.types/user.info/user.info.domain.model";
import { UserInfo } from "../../../models/user.info.model";

///////////////////////////////////////////////////////////////////////////////

export class UserInfoMapper {

    static toDto = (userInfo: UserInfo): UserInfoDto => {
        if (!userInfo) {
            return null;
        }
         const dto: UserInfoDto = {
            autoIncrementalID : userInfo.autoIncrementalID,
            userID            : userInfo.userID,
            userPlatformID    : userInfo.userPlatformID,
            userName          : userInfo.userName,
            userAge           : userInfo.userAge,
            userGender        : userInfo.userGender,
            userInfo          : userInfo.userInfo,
            infoProvided      : userInfo.infoProvided,
        };

        return dto;
    };

}
