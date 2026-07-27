import { UserInfoDto, UserInfoDomainModel } from "../../../domain.types/user.info/user.info.domain.model";
import { UserInfoMapper } from "../../../database/mapper/user.info.mapper";
import { UserInfo } from "../../../models/user.info.model";
import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";

///////////////////////////////////////////////////////////////////////////////

export class UserInfoRepo {

    static getUserInfoByPlatformId = async (container: DependencyContainer, platformId: string):
    Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);
            const result: UserInfo | null = await userInfoRepository.findOne(
                { where: { userPlatformID: platformId != null ? String(platformId) : platformId } }
            );
            const userInfoDto: UserInfoDto | null = UserInfoMapper.toDto(result);
            return userInfoDto;
        } catch (error) {
            console.error('Error finding user info by platform ID:', error);
            return null;
        }
    };

    static createUserInfo = async (container: DependencyContainer, model: UserInfoDomainModel):
    Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);
            const created: UserInfo = await userInfoRepository.create(model as Partial<UserInfo>);
            const userInfoDto: UserInfoDto | null = UserInfoMapper.toDto(created);
            return userInfoDto;
        } catch (error) {
            console.error('Error creating user info:', error);
            return null;
        }
    };

    static updateUserInfo = async (container: DependencyContainer, platformId: string, model: UserInfoDomainModel):
    Promise<UserInfoDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userInfoRepository = entityManager.getRepository(UserInfo);
            const result: UserInfo | null = await userInfoRepository.findOne(
                { where: { userPlatformID: platformId != null ? String(platformId) : platformId } }
            );
            if (result) {
                const updated: UserInfo = await result.update(model as Partial<UserInfo>);
                return UserInfoMapper.toDto(updated);
            }
            return null;
        } catch (error) {
            console.error('Error updating user info by platform ID:', error);
            return null;
        }
    };

}
