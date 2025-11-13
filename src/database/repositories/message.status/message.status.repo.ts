import { MessageStatus } from "../../../models/message.status";
import { MessageStatusDto } from "../../../domain.types/message.status/message.status.domain.model";
import { MessageStatusMapper } from "../../mapper/message.status/message.status.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class MessageStatusRepo {

    // 🔍 Find a message status by ID
    static findStatusById = async (container, autoIncrementalID: number): Promise<MessageStatusDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const messageStatusRepository = entityManager.getRepository(MessageStatus);
            const result: MessageStatus | null = await messageStatusRepository.findOne({ where: { autoIncrementalID } });

            if (!result) {
                return null;
            }

            const messageStatusDto: MessageStatusDto = MessageStatusMapper.toDto(result);
            return messageStatusDto;

        } catch (error) {
            console.error("Error finding message status by ID:", error);
            return null;
        }
    };

    // 🆕 Create a new message status
    static createStatus = async (container, data: Partial<MessageStatusDto>): Promise<MessageStatusDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const messageStatusRepository = entityManager.getRepository(MessageStatus);

            const newStatus = await messageStatusRepository.create(data);
            const messageStatusDto: MessageStatusDto = MessageStatusMapper.toDto(newStatus);

            return messageStatusDto;

        } catch (error) {
            console.error("Error creating message status:", error);
            return null;
        }
    };

    // 🔁 Update message status by ID
    static updateStatus = async (
        container,
        autoIncrementalID: number,
        updates: Partial<MessageStatusDto>
    ): Promise<MessageStatusDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const messageStatusRepository = entityManager.getRepository(MessageStatus);

            const existing = await messageStatusRepository.findOne({ where: { autoIncrementalID } });
            if (!existing) {
                return null;
            }

            await existing.update(updates);
            const updatedDto: MessageStatusDto = MessageStatusMapper.toDto(existing);

            return updatedDto;

        } catch (error) {
            console.error("Error updating message status:", error);
            return null;
        }
    };
}
