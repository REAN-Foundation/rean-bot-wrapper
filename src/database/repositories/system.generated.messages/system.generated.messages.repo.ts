import { SystemGeneratedMessages } from "../../../models/system.generated.messages.model";
import { SystemGeneratedMessagesDto } from "../../../domain.types/system.generated.messages/system.generated.messages.domain.model";
import { SystemGeneratedMessagesMapper } from "../../mapper/system.generated.messages/system.generated.messages.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class SystemGeneratedMessagesRepo {

    static findById = async (container, id: string): Promise<SystemGeneratedMessagesDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(SystemGeneratedMessages);
            const result: SystemGeneratedMessages | null = await repo.findOne({ where: { id } });

            if (!result) {
                return null;
            }

            return SystemGeneratedMessagesMapper.toDto(result);
        } catch (error) {
            console.error("Error finding system-generated message by ID:", error);
            return null;
        }
    };

    static create = async (
        container,
        payload: Omit<SystemGeneratedMessagesDto, "id">
    ): Promise<SystemGeneratedMessagesDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(SystemGeneratedMessages);
            const result = await repo.create(payload);
            return SystemGeneratedMessagesMapper.toDto(result);
        } catch (error) {
            console.error("Error creating system-generated message:", error);
            return null;
        }
    };

    static update = async (
        container,
        id: string,
        payload: Partial<SystemGeneratedMessagesDto>
    ): Promise<SystemGeneratedMessagesDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const repo = entityManager.getRepository(SystemGeneratedMessages);
            const message = await repo.findOne({ where: { id } });

            if (!message) {
                return null;
            }

            await message.update(payload);
            return SystemGeneratedMessagesMapper.toDto(message);
        } catch (error) {
            console.error("Error updating system-generated message:", error);
            return null;
        }
    };
}
