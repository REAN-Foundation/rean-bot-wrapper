import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { Intents } from "../../../models/intents/intents.model";
import { IntentDto } from "../../../domain.types/intents/intents.domain.model";
import { IntentsMapper } from "../../../database/mapper/intents.mapper";
import { IntentType } from "../../../domain.types/intents/intents.types";

///////////////////////////////////////////////////////////////////////////////

export class IntentRepo {

    static findIntentByCode = async (container: DependencyContainer, code: string): Promise<IntentDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const intentRepository = entityManager.getRepository(Intents);
            const intent: Intents | null = await intentRepository.findOne(
                { where: { code: code } }
            );
            const intentDto: IntentDto = IntentsMapper.toDto(intent);
            return intentDto;
        } catch (error) {
            console.error('Error finding intent by code:', error);
            return null;
        }
    };

    static findIntentByCodeAndType = async (container: DependencyContainer, code: string, type: IntentType):Promise<IntentDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const intentRepository = entityManager.getRepository(Intents);
            const intent: Intents | null = await intentRepository.findOne(
                { where: { code: code, type: type } }
            );
            const intentDto: IntentDto = IntentsMapper.toDto(intent);
            return intentDto;
        } catch (error) {
            console.error('Error finding intent by code and type:', error);
            return null;
        }
    };

}
