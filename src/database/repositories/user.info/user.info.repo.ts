import { UserInfo } from "../../../models/user.info.model";
import { UserInfoDto } from "../../../domain.types/user.info/user.info.domain.model";
import { UserInfoMapper } from "../../mapper/user.info/user.info.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class UserInfoRepo {

    static findUserInfoByUserId = async (container, userID: number): Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);
            const result: UserInfo | null = await userInfoRepository.findOne({ where: { userID } });

            if (!result) {
                return null;
            }

            const userInfoDto: UserInfoDto = UserInfoMapper.toDto(result);
            return userInfoDto;

        } catch (error) {
            console.error("Error finding user info by user ID:", error);
            return null;
        }
    };

    static findUserInfoByPlatformId = async (container, userPlatformID: string): Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);
            const result: UserInfo | null = await userInfoRepository.findOne({ where: { userPlatformID } });

            if (!result) {
                return null;
            }

            const userInfoDto: UserInfoDto = UserInfoMapper.toDto(result);
            return userInfoDto;

        } catch (error) {
            console.error("Error finding user info by platform ID:", error);
            return null;
        }
    };

    static createUserInfo = async (container, userInfoData: UserInfoDto): Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);

            const newUserInfo = await userInfoRepository.create(userInfoData);
            const savedUserInfo = await newUserInfo.save();

            const userInfoDto: UserInfoDto = UserInfoMapper.toDto(savedUserInfo);
            return userInfoDto;

        } catch (error) {
            console.error("Error creating user info record:", error);
            return null;
        }
    };

    static updateUserInfoByUserId = async (
        container,
        userID: number,
        updates: Partial<UserInfoDto>
    ): Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);

            const userInfo = await userInfoRepository.findOne({ where: { userID } });
            if (!userInfo) {
                console.warn(`User info not found for userID: ${userID}`);
                return null;
            }

            await userInfo.update(updates);
            const updatedUserInfo = await userInfo.reload();

            const userInfoDto: UserInfoDto = UserInfoMapper.toDto(updatedUserInfo);
            return userInfoDto;

        } catch (error) {
            console.error("Error updating user info record:", error);
            return null;
        }
    };
}
