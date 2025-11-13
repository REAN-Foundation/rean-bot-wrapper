/* eslint-disable indent */
import { AssessmentSessionLogs } from "../../../models/assessment.session.model";
import { AssessmentSessionLogsDto } from "../../../domain.types/assessment.session.logs/assessment.session.logs.domain.model";
import { AssessmentSessionLogsMapper } from "../../mapper/assessment.session.logs/assessment.session.logs.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class AssessmentSessionLogsRepo {

    static create = async (container, model: AssessmentSessionLogsDto): Promise<AssessmentSessionLogsDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(AssessmentSessionLogs);

            const created = await repo.create({
                userPlatformId       : model.userPlatformId,
                patientUserId        : model.patientUserId,
                assessmentTemplateId : model.assessmentTemplateId,
                assesmentId          : model.assesmentId,
                assesmentNodeId      : model.assesmentNodeId,
                userResponseType     : model.userResponseType,
                userResponse         : model.userResponse,
                userResponseTime     : model.userResponseTime,
                userMessageId        : model.userMessageId,
            });

            const saved = await repo.save(created);
            return AssessmentSessionLogsMapper.toDto(saved);

        } catch (error) {
            console.error("Error creating AssessmentSessionLogs:", error);
            return null;
        }
    };

    static getById = async (container, id: number): Promise<AssessmentSessionLogsDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(AssessmentSessionLogs);

            const entity = await repo.findOne({ where: { autoIncrementalID: id } });
            return entity ? AssessmentSessionLogsMapper.toDto(entity) : null;
        } catch (error) {
            console.error("Error fetching AssessmentSessionLogs by ID:", error);
            return null;
        }
    };

    static getAll = async (container): Promise<AssessmentSessionLogsDto[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(AssessmentSessionLogs);

            const entities = await repo.findAll();
            return entities.map(e => AssessmentSessionLogsMapper.toDto(e));
        } catch (error) {
            console.error("Error fetching all AssessmentSessionLogs:", error);
            return [];
        }
    };

    static findAllBySessionId = async (container, assessmentSessionId: number): Promise<AssessmentSessionLogsDto[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(AssessmentSessionLogs);

            const entities = await repo.findAll({ where: { assessmentSessionId } });
            return entities.map(e => AssessmentSessionLogsMapper.toDto(e));
        } catch (error) {
            console.error("Error fetching AssessmentSessionLogs by assessmentSessionId:", error);
            return [];
        }
    };

    static update = async (container, id: number, updates: Partial<AssessmentSessionLogsDto>): Promise<AssessmentSessionLogsDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(AssessmentSessionLogs);

            const entity = await repo.findOne({ where: { autoIncrementalID: id } });
            if (!entity) {
                return null;
            }

            await entity.update(updates);
            const updated = await repo.findOne({ where: { autoIncrementalID: id } });
            return updated ? AssessmentSessionLogsMapper.toDto(updated) : null;
        } catch (error) {
            console.error("Error updating AssessmentSessionLogs:", error);
            return null;
        }
    };

    static delete = async (container, id: number): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(AssessmentSessionLogs);

            const deletedCount = await repo.destroy({ where: { autoIncrementalID: id } });
            return deletedCount > 0;
        } catch (error) {
            console.error("Error deleting AssessmentSessionLogs:", error);
            return false;
        }
    };

}
