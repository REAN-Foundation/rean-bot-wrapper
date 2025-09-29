import { UserConsentDto } from '../../domain.types/user.consent/user.consent.domain.model';
import { UserConsent } from '../../models/user.consent.model';

///////////////////////////////////////////////////////////////////////////////////

export class UserConsentMapper {

    static toDto = (userConsent: UserConsent): UserConsentDto => {
        if (userConsent == null){
            return null;
        }
        const dto: UserConsentDto = {
            id: userConsent.id,
            userPlatformID: userConsent.userPlatformID,
            consentGiven: userConsent.consentGiven
        };
        return dto;
    };

}
