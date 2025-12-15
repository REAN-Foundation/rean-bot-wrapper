import { RepositoryHelper } from "../repo.helper";
import { DependencyContainer } from "tsyringe";
import { SystemGeneratedMessages } from "../../../models/system.generated.messages.model";
import { systemGeneratedMessagesMapper } from "../../../database/mapper/system.generated.message.mapper";
import { SystemGeneratedMessagesDto } from "../../../domain.types/intents/system.messages.types";

///////////////////////////////////////////////////////////////////////////////

export class SystemGeneratedMessagesRepo {

    static findMessageByName = async (container: DependencyContainer, name: string):
    Promise<SystemGeneratedMessagesDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const systemGeneratedMessagesRepository = entityManager.getRepository(SystemGeneratedMessages);
            const message: SystemGeneratedMessages | null = await systemGeneratedMessagesRepository.findOne(
                { where: { messageName: name } }
            );
            const messageDto: SystemGeneratedMessagesDto = systemGeneratedMessagesMapper.toDto(message);
            return messageDto;
        } catch (error) {
            console.error('Error finding system message by name:', error);
            return null;
        }
    }

}
