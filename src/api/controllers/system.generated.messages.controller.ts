/* eslint-disable @typescript-eslint/no-unused-vars */
import { inject, scoped, Lifecycle } from "tsyringe";
import { EntityManagerProvider } from "../../services/entity.manager.provider.service";
import { SystemGeneratedMessages } from "../../models/system.generated.messages.model";
import { SystemGeneratedMessageMetadata } from "../../models/system.generated.message.metadata.model";
import { ErrorHandler } from "../../utils/error.handler";
import { ResponseHandler } from "../../utils/response.handler";
import { ClientEnvironmentProviderService } from "../../services/set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class SystemGeneratedMessagesController {

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
    ){}

    create = async (request, response) => {
        try {
            const { repository, metadataRepository, clientName } = await this.getContextualServices(request);
            const messageName = request.body.name;
            const messageExists =
                await repository.findOne({ where: { messageName: messageName } });
            if (messageExists) {
                this.responseHandler.sendSuccessResponse(response, 200, 'Message already exists', '');
            } else {
                const messageObj = {
                    messageName    : messageName,
                    messageContent : request.body.content,
                    languageCode   : request.body.language
                };
                const data = await repository.create(messageObj);
                let customPayload = null;
                if (request.body.customPayload !== undefined) {
                    const metadata =
                        await this.saveMetadata(metadataRepository, data.id, request.body.customPayload);
                    customPayload = metadata ? metadata.customPayload : null;
                }
                this.responseHandler.sendSuccessResponse(
                    response, 200, 'Message added to database', { ...data.dataValues, customPayload: customPayload });
            }
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    getAll = async (request, response) => {
        try {
            const { repository, metadataRepository, clientName } = await this.getContextualServices(request);
            const messages = await repository.findAll();
            const metadataRows = await metadataRepository.findAll();
            const customPayloadByMessageId = {};
            for (const metadata of metadataRows) {
                customPayloadByMessageId[metadata.messageId] = metadata.customPayload;
            }
            const data = messages.map((message) => ({
                ...message.dataValues,
                customPayload : customPayloadByMessageId[message.id] ?? null
            }));
            this.responseHandler.sendSuccessResponse(response, 200, 'Messages retrieved', data);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    getById = async (request, response) => {
        try {
            const { repository, metadataRepository, clientName } = await this.getContextualServices(request);
            const data = await repository.findOne({ where: { id: request.params.id } });
            if (data) {
                const customPayload = await this.getCustomPayload(metadataRepository, data.id);
                this.responseHandler.sendSuccessResponse(
                    response, 200, 'Message retrieved', { ...data.dataValues, customPayload: customPayload });
            } else {
                this.errorHandler.handleControllerError('No message found with the id', response, request);
            }
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    update = async (request, response) => {
        try {
            const id = request.params.id;
            const { name, content, languageCode, customPayload } = request.body;

            const { repository, metadataRepository, clientName } = await this.getContextualServices(request);

            const message = await repository.findByPk(id);

            if (!message) {
                this.responseHandler.sendFailureResponse(response, 404, 'Message not found');
            }

            message.messageName = name || message.messageName;
            message.messageContent = content || message.messageContent;
            message.languageCode = languageCode || message.languageCode;

            await message.save();
            let savedCustomPayload = await this.getCustomPayload(metadataRepository, message.id);
            if (customPayload !== undefined) {
                const metadata = await this.saveMetadata(metadataRepository, message.id, customPayload);
                savedCustomPayload = metadata ? metadata.customPayload : null;
            }
            this.responseHandler.sendSuccessResponse(
                response, 200, 'Message updated successfully',
                { ...message.dataValues, customPayload: savedCustomPayload });
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    delete = async (request, response) => {
        try {
            const id = request.params.id;

            const { repository, metadataRepository, clientName } = await this.getContextualServices(request);

            const message = await repository.findByPk(id);

            if (!message) {
                this.responseHandler.sendFailureResponse(response, 404, 'Message not found');
            }

            // Remove the metadata first so a deleted message never leaves an orphan row behind.
            await this.saveMetadata(metadataRepository, message.id, null);
            await message.destroy();

            this.responseHandler.sendSuccessResponse(response, 200, 'Message deleted successfully', null);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    private async getContextualServices(request) {
        const clientEnvironmentProvider = request.container.resolve(ClientEnvironmentProviderService);
        const clientName = await clientEnvironmentProvider.getClientEnvironmentVariable("Name");

        const entityManagerProvider = request.container.resolve(EntityManagerProvider);
        const entityManager = await entityManagerProvider.getEntityManager(clientEnvironmentProvider, clientName);
        const repository = entityManager.getRepository(SystemGeneratedMessages);
        const metadataRepository = entityManager.getRepository(SystemGeneratedMessageMetadata);

        return { clientEnvironmentProvider, clientName, repository, metadataRepository };
    }

    // Creates, updates or removes the metadata row for a message depending on what was sent.
    // An explicit null clears the extra message; an absent key leaves the metadata untouched.
    private async saveMetadata(metadataRepository, messageId: string, customPayload: any) {
        const metadata = await metadataRepository.findOne({ where: { messageId: messageId } });
        if (customPayload === null) {
            if (metadata) {
                await metadata.destroy();
            }
            return null;
        }
        if (metadata) {
            metadata.customPayload = customPayload;
            await metadata.save();
            return metadata;
        }
        return await metadataRepository.create({
            messageId     : messageId,
            customPayload : customPayload
        });
    }

    private async getCustomPayload(metadataRepository, messageId: string) {
        const metadata = await metadataRepository.findOne({ where: { messageId: messageId } });
        return metadata ? metadata.customPayload : null;
    }

}
