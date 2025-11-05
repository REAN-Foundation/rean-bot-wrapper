import { ChatSession } from "../../../models/chat.session";
import { ChatSessionDto } from "../../../domain.types/chat.session/chat.session.domain.model";
import { ChatSessionMapper } from "../../mapper/chat.session/chat.session.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class ChatSessionRepo {

    static findChatSessionById = async (container, sessionId: string): Promise<ChatSessionDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatSessionRepository = entityManager.getRepository(ChatSession);
            const result: ChatSession | null = await chatSessionRepository.findOne({ where: { id: sessionId } });

            if (!result) {
                return null;
            }

            const chatSessionDto: ChatSessionDto = ChatSessionMapper.toDto(result);
            return chatSessionDto;

        } catch (error) {
            console.error("Error finding chat session by ID:", error);
            return null;
        }
    };

    static create = async (container, sessionData: Partial<ChatSession>): Promise<ChatSessionDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatSessionRepository = entityManager.getRepository(ChatSession);

            const newSession = chatSessionRepository.create(sessionData);
            const savedSession = await chatSessionRepository.save(newSession);

            return ChatSessionMapper.toDto(savedSession);

        } catch (error) {
            console.error("Error creating chat session:", error);
            return null;
        }
    };

    static update = async (container, sessionId: string, updateData: Partial<ChatSession>): Promise<ChatSessionDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const chatSessionRepository = entityManager.getRepository(ChatSession);

            await chatSessionRepository.update({ id: sessionId }, updateData);
            const updatedSession = await chatSessionRepository.findOne({ where: { id: sessionId } });

            if (!updatedSession) {
                return null;
            }

            return ChatSessionMapper.toDto(updatedSession);

        } catch (error) {
            console.error("Error updating chat session:", error);
            return null;
        }
    };

}
