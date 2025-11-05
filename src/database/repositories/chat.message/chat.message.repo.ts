import { ChatMessage } from "../../../models/chat.message.model";
import { ChatMessageDto } from "../../../domain.types/chat.message/chat.message.domain.model";
import { ChatMessageMapper } from "../../mapper/chat.message/chat.message.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class ChatMessageRepo {

    static findMessageById = async (container, messageId: string): Promise<ChatMessageDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            const result: ChatMessage | null = await chatMessageRepository.findOne({ where: { id: messageId } });

            if (!result) {
                return null;
            }

            const chatMessageDto: ChatMessageDto = ChatMessageMapper.toDto(result);
            return chatMessageDto;

        } catch (error) {
            console.error("Error finding chat message by ID:", error);
            return null;
        }
    };

    static findMessagesBySessionId = async (container, chatSessionID: string): Promise<ChatMessageDto[]> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);
            const results: ChatMessage[] = await chatMessageRepository.find({ where: { chatSessionID } });

            const chatMessageDtos: ChatMessageDto[] = results.map(msg => ChatMessageMapper.toDto(msg));
            return chatMessageDtos;

        } catch (error) {
            console.error("Error finding messages by chat session ID:", error);
            return [];
        }
    };

    static create = async (container, messageData: Partial<ChatMessage>): Promise<ChatMessageDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);

            const newMessage = chatMessageRepository.create(messageData);
            const savedMessage = await chatMessageRepository.save(newMessage);

            return ChatMessageMapper.toDto(savedMessage);

        } catch (error) {
            console.error("Error creating chat message:", error);
            return null;
        }
    };

    static update = async (container, messageId: string, updateData: Partial<ChatMessage>): Promise<ChatMessageDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatMessageRepository = entityManager.getRepository(ChatMessage);

            await chatMessageRepository.update({ id: messageId }, updateData);
            const updatedMessage = await chatMessageRepository.findOne({ where: { id: messageId } });

            if (!updatedMessage) {
                return null;
            }

            return ChatMessageMapper.toDto(updatedMessage);

        } catch (error) {
            console.error("Error updating chat message:", error);
            return null;
        }
    };

}
