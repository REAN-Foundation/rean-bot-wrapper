import { AssessmentIdentifiers } from "../../../models/assessment/assessment.identifiers.model";
import { AssessmentIdentifiersDto } from "../../../domain.types/assessment.identifiers/assessment.identifiers.domain.model";
import { AssessmentIdentifiersMapper } from "../../mapper/assessment.identifiers/assessment.identifiers.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class AssessmentIdentifiersRepo {

    static findById = async (container, id: number): Promise<AssessmentIdentifiersDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const identifiersRepository = entityManager.getRepository(AssessmentIdentifiers);
            const result: AssessmentIdentifiers | null = await identifiersRepository.findOne({ where: { autoIncrementalID: id } });

            if (!result) {
                return null;
            }

            const dto: AssessmentIdentifiersDto = AssessmentIdentifiersMapper.toDto(result);
            return dto;
        } catch (error) {
            console.error("Error finding AssessmentIdentifiers by ID:", error);
            return null;
        }
    };

    static create = async (container, data: AssessmentIdentifiersDto): Promise<AssessmentIdentifiersDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const identifiersRepository = entityManager.getRepository(AssessmentIdentifiers);
            const created = await identifiersRepository.create(data);

            const dto: AssessmentIdentifiersDto = AssessmentIdentifiersMapper.toDto(created);
            return dto;
        } catch (error) {
            console.error("Error creating AssessmentIdentifiers:", error);
            return null;
        }
    };

    static update = async (container, id: number, updates: Partial<AssessmentIdentifiersDto>): Promise<AssessmentIdentifiersDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const identifiersRepository = entityManager.getRepository(AssessmentIdentifiers);

            const existing = await identifiersRepository.findOne({ where: { autoIncrementalID: id } });
            if (!existing) {
                return null;
            }

            await existing.update(updates);

            const updatedDto: AssessmentIdentifiersDto = AssessmentIdentifiersMapper.toDto(existing);
            return updatedDto;
        } catch (error) {
            console.error("Error updating AssessmentIdentifiers:", error);
            return null;
        }
    };
}
