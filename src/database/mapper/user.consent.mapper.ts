import type { UserConsentDto } from '../../domain.types/user.consent/user.consent.domain.model.js';
import { UserConsent } from '../../models/user.consent.model.js';

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
