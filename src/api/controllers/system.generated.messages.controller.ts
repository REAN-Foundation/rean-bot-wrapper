/* eslint-disable @typescript-eslint/no-unused-vars */
import { inject, scoped, Lifecycle } from "tsyringe";
import { EntityManagerProvider } from "../../services/entity.manager.provider.service";
import { SystemGeneratedMessages } from "../../models/system.generated.messages.model";
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
            const { repository, clientName } = await this.getContextualServices(request);
            const messageName = request.body.name;
            const messageExists =
                await repository.findOne({where: {messageName: messageName}});
            if (messageExists) {
                this.responseHandler.sendSuccessResponse(response, 200, 'Message already exists', '');
            } else {
                const messageObj = {
                    messageName    : messageName,
                    messageContent : request.body.content,
                    languageCode   : request.body.language
                };
                const data = await repository.create(messageObj);
                this.responseHandler.sendSuccessResponse(response, 200, 'Message added to database', data);
            }
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    getAll = async (request, response) => {
        try {
            const { repository, clientName } = await this.getContextualServices(request);
            const data = await repository.findAll();
            this.responseHandler.sendSuccessResponse(response, 200, 'Messages retrieved', data);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    getById = async (request, response) => {
        try {
            const { repository, clientName } = await this.getContextualServices(request);
            const data = await repository.findOne({ where: { id: request.params.id } });
            if (data) {
                this.responseHandler.sendSuccessResponse(response, 200, 'Message retrieved', data);
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
            const { name, content, languageCode } = request.body;

            const { repository, clientName } = await this.getContextualServices(request);

            const message = await repository.findByPk(id);

            if (!message) {
                this.responseHandler.sendFailureResponse(response, 404, 'Message not found');
            }

            message.messageName = name || message.messageName;
            message.messageContent = content || message.messageContent;
            message.languageCode = languageCode || message.languageCode;

            await message.save();
            this.responseHandler.sendSuccessResponse(response, 200, 'Message updated successfully', message);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    delete = async (request, response) => {
        try {
            const id = request.params.id;

            const { repository, clientName } = await this.getContextualServices(request);

            const message = await repository.findByPk(id);

            if (!message) {
                this.responseHandler.sendFailureResponse(response, 404, 'Message not found');
            }

            await message.destroy();

            this.responseHandler.sendSuccessResponse(response, 200, 'Message deleted successfully', null);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    private async getContextualServices(request) {
        const clientEnvironmentProvider = request.container.resolve(ClientEnvironmentProviderService);
        const clientName = clientEnvironmentProvider.getClientEnvironmentVariable("Name");

        const entityManagerProvider = request.container.resolve(EntityManagerProvider);
        const repository = (
            await entityManagerProvider.getEntityManager(clientEnvironmentProvider, clientName)
        ).getRepository(SystemGeneratedMessages);

        return { clientEnvironmentProvider, clientName, repository };
    }
}
