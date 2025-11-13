import { AssessmentSessionLogsDto } from "../../../domain.types/assessment.session.logs/assessment.session.logs.domain.model";
import { AssessmentSessionLogs } from "../../../models/assessment.session.model";

///////////////////////////////////////////////////////////////////////////////

export class AssessmentSessionLogsMapper {

    static toDto = (model: AssessmentSessionLogs): AssessmentSessionLogsDto => {
        if (!model) {
            return null;
        }

        const dto: AssessmentSessionLogsDto = {
            autoIncrementalID  : model.autoIncrementalID,
            userPlatformId     : model.userPlatformId,
            patientUserId      : model.patientUserId,
            assessmentTemplateId: model.assessmentTemplateId,
            assesmentId        : model.assesmentId,
            assesmentNodeId    : model.assesmentNodeId,
            userResponseType   : model.userResponseType,
            userResponse       : model.userResponse,
            userResponseTime   : model.userResponseTime,
            userMessageId      : model.userMessageId,
            createdAt          : model.createdAt,
            updatedAt          : model.updatedAt,
        };

        return dto;
    };

}
