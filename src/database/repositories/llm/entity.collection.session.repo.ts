import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { EntityCollectionSession } from "../../../models/llm/entity.collection.session.model";
import { IEntityCollectionSession } from "../../../refactor/interface/llm/llm.interfaces";
import { Op } from "sequelize";

///////////////////////////////////////////////////////////////////////////////

export class EntityCollectionSessionRepo {

    static create = async (
        container: DependencyContainer,
        sessionData: Partial<IEntityCollectionSession>
    ): Promise<IEntityCollectionSession | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const session: EntityCollectionSession = await repository.create(sessionData);
            return session.toJSON() as IEntityCollectionSession;
        } catch (error) {
            console.error('Error creating entity collection session:', error);
            return null;
        }
    };

    static findBySessionId = async (
        container: DependencyContainer,
        sessionId: string
    ): Promise<IEntityCollectionSession | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const session: EntityCollectionSession | null = await repository.findOne({
                where : { sessionId }
            });
            return session ? session.toJSON() as IEntityCollectionSession : null;
        } catch (error) {
            console.error('Error finding session by sessionId:', error);
            return null;
        }
    };

    static findByUserPlatformId = async (
        container: DependencyContainer,
        userPlatformId: string,
        limit = 10
    ): Promise<IEntityCollectionSession[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const sessions: EntityCollectionSession[] = await repository.findAll({
                where : { userPlatformId },
                order : [['createdAt', 'DESC']],
                limit
            });
            return sessions.map(s => s.toJSON() as IEntityCollectionSession);
        } catch (error) {
            console.error('Error finding sessions by userPlatformId:', error);
            return [];
        }
    };

    static findActiveByUserPlatformId = async (
        container: DependencyContainer,
        userPlatformId: string
    ): Promise<IEntityCollectionSession | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const session: EntityCollectionSession | null = await repository.findOne({
                where : {
                    userPlatformId,
                    status : 'active'
                },
                order : [['lastActivityAt', 'DESC']]
            });
            return session ? session.toJSON() as IEntityCollectionSession : null;
        } catch (error) {
            console.error('Error finding active session:', error);
            return null;
        }
    };

    static update = async (
        container: DependencyContainer,
        sessionId: string,
        updates: Partial<IEntityCollectionSession>
    ): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const [affectedCount] = await repository.update(updates, {
                where : { sessionId }
            });
            return affectedCount > 0;
        } catch (error) {
            console.error('Error updating session:', error);
            return false;
        }
    };

    static delete = async (
        container: DependencyContainer,
        sessionId: string
    ): Promise<boolean> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const affectedCount = await repository.destroy({
                where : { sessionId }
            });
            return affectedCount > 0;
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        }
    };

    static findTimedOutSessions = async (
        container: DependencyContainer
    ): Promise<IEntityCollectionSession[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repository = entityManager.getRepository(EntityCollectionSession);
            const sessions: EntityCollectionSession[] = await repository.findAll({
                where : {
                    status    : 'active',
                    timeoutAt : {
                        [Op.lt] : new Date()
                    }
                }
            });
            return sessions.map(s => s.toJSON() as IEntityCollectionSession);
        } catch (error) {
            console.error('Error finding timed out sessions:', error);
            return [];
        }
    };
}
