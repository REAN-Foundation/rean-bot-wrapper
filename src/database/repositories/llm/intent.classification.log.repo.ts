import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { IntentClassificationLog } from "../../../models/llm/intent.classification.log.model";
import { IIntentClassificationLog } from "../../../refactor/interface/llm/llm.interfaces";

///////////////////////////////////////////////////////////////////////////////

export class IntentClassificationLogRepo {

    static create = async (
        container: DependencyContainer,
        logData: Partial<IIntentClassificationLog>
    ): Promise<IIntentClassificationLog | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentClassificationLog);
            const log: IntentClassificationLog = await repository.create(logData);
            return log.toJSON() as IIntentClassificationLog;
        } catch (error) {
            console.error('Error creating classification log:', error);
            return null;
        }
    };

    static findByUserPlatformId = async (
        container: DependencyContainer,
        userPlatformId: string,
        limit: number = 10
    ): Promise<IIntentClassificationLog[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentClassificationLog);
            const logs: IntentClassificationLog[] = await repository.findAll({
                where: { userPlatformId },
                order: [['createdAt', 'DESC']],
                limit
            });
            return logs.map(log => log.toJSON() as IIntentClassificationLog);
        } catch (error) {
            console.error('Error finding classification logs:', error);
            return [];
        }
    };

    static findByIntentId = async (
        container: DependencyContainer,
        intentId: string,
        limit: number = 100
    ): Promise<IIntentClassificationLog[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentClassificationLog);
            const logs: IntentClassificationLog[] = await repository.findAll({
                where: { intentId },
                order: [['createdAt', 'DESC']],
                limit
            });
            return logs.map(log => log.toJSON() as IIntentClassificationLog);
        } catch (error) {
            console.error('Error finding classification logs by intent:', error);
            return [];
        }
    };

    static findByMethod = async (
        container: DependencyContainer,
        method: 'llm' | 'dialogflow' | 'button',
        limit: number = 100
    ): Promise<IIntentClassificationLog[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(IntentClassificationLog);
            const logs: IntentClassificationLog[] = await repository.findAll({
                where: { classificationMethod: method },
                order: [['createdAt', 'DESC']],
                limit
            });
            return logs.map(log => log.toJSON() as IIntentClassificationLog);
        } catch (error) {
            console.error('Error finding classification logs by method:', error);
            return [];
        }
    };

}
