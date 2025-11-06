import type { UserConsentDto } from "../../../domain.types/user.consent/user.consent.domain.model.js";
import { UserConsentMapper } from "../../../database/mapper/user.consent.mapper.js";
import { UserConsent } from "../../../models/user.consent.model.js";
import { RepositoryHelper } from "../repo.helper.js";

///////////////////////////////////////////////////////////////////////////////

export class UserConsentRepo {

    static findUserConsentByPlatformId = async (container, platformId: string): Promise<UserConsentDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userConsentRepository = entityManager.getRepository(UserConsent);
            const result: UserConsent | null = await userConsentRepository.findOne({ where: { userPlatformID: platformId } });
            const userConsentDto: UserConsentDto = UserConsentMapper.toDto(result);
            return userConsentDto;
        } catch (error) {
            console.error('Error finding user consent by platform ID:', error);
            return null;
        }
    };

    static getUserConsentByPlatformId = async (container, platformId: string): Promise<UserConsentDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userConsentRepository = entityManager.getRepository(UserConsent);
            const result: UserConsent | null = await userConsentRepository.findOne({ where: { userPlatformID: platformId } });
            const userConsentDto: UserConsentDto = UserConsentMapper.toDto(result);
            return userConsentDto;
        } catch (error) {
            console.error('Error finding user consent by platform ID:', error);
            return null;
        }
    };

    static updateUserConsent = async (container, platformId: string, consentGiven: string): Promise<UserConsentDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const userConsentRepository = entityManager.getRepository(UserConsent);
            const result: UserConsent | null = await userConsentRepository.findOne({ where: { userPlatformID: platformId } });
            if (result){
                const updatedUserConsent: UserConsent = await result.update({ consentGiven: consentGiven });
                return UserConsentMapper.toDto(updatedUserConsent);
            }
            return null;
        }
        catch (error) {
            console.error('Error updating user consent by platform ID:', error);
            return null;
        }
    };
}
