import { AssessmentIdentifiersDto } from "../../../domain.types/assessment.identifiers/assessment.identifiers.domain.model";
import { AssessmentIdentifiers } from "../../../models/assessment/assessment.identifiers.model";

///////////////////////////////////////////////////////////////////////////////

export class AssessmentIdentifiersMapper {

    static toDto = (assessmentIdentifiers: AssessmentIdentifiers): AssessmentIdentifiersDto => {
        if (!assessmentIdentifiers) {
            return null;
        }

        const dto: AssessmentIdentifiersDto = {
            autoIncrementalID  : assessmentIdentifiers.autoIncrementalID,
            assessmentSessionId: assessmentIdentifiers.assessmentSessionId,
            identifier         : assessmentIdentifiers.identifier,
            userResponseType   : assessmentIdentifiers.userResponseType,
            identifierUnit     : assessmentIdentifiers.identifierUnit,
        };

        return dto;
    };
}
