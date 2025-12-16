import { inject, scoped, Lifecycle } from "tsyringe";
import { EntityManagerProvider } from "../../services/entity.manager.provider.service";
import { ErrorHandler } from "../../utils/error.handler";
import { ResponseHandler } from "../../utils/response.handler";
import { Intents } from "../../models/intents/intents.model";
import { ClientEnvironmentProviderService } from "../../services/set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class IntentsController {

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
    ) {}

    create = async (request, response) => {
        try {
            const { repository, clientName } = await this.getContextualServices(request);
            console.log("Inside creating intents for ", clientName);
            const intentCode = request.body.code;
            const intentExists =
                await repository.findOne({ where: { code: intentCode } });
            if (intentExists) {
                this.responseHandler.sendSuccessResponse(response, 200, 'Intent already exists', '');
            } else {
                const intentObj = {
                    name     : request.body.name,
                    code     : intentCode,
                    type     : request.body.type,
                    Metadata : JSON.stringify(request.body.metadata)
                };
                const data = await repository.create(intentObj);
                this.responseHandler.sendSuccessResponse(response, 200, 'Intent added to database', data);
            }
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    getAll = async (request, response) => {
        try {
            const { repository, clientName } = await this.getContextualServices(request);
            console.log("Inside get all intents for ", clientName);
            const data = await repository.findAll();
            this.responseHandler.sendSuccessResponse(response, 200, 'Intents retrieved', data);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    getById = async (request, response) => {
        try {
            const { repository, clientName } = await this.getContextualServices(request);
            console.log("Inside get by id for ", clientName);
            const data = await repository.findOne({ where: { id: request.params.id } });
            if (data) {
                this.responseHandler.sendSuccessResponse(response, 200, 'Intent retrieved', data);
            } else {
                this.errorHandler.handleControllerError('No intent found with the id', response, request);
            }
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    update = async (request, response) => {
        try {
            const intentId = request.params.id;
            const { name, code, type, metadata } = request.body;

            const { repository, clientName } = await this.getContextualServices(request);
            console.log("Inside updating the intent for ", clientName);

            const intent = await repository.findByPk(intentId);

            if (!intent) {
                this.responseHandler.sendFailureResponse(response, 404, 'Intent not found');
            }

            intent.name = name || intent.name;
            intent.code = code || intent.code;
            intent.type = type || intent.type;
            intent.Metadata = JSON.stringify(metadata) || intent.Metadata;

            await intent.save();
            this.responseHandler.sendSuccessResponse(response, 200, 'Intent updated successfully', intent);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    delete = async (request, response) => {
        try {
            const intentId = request.params.id;

            const { repository, clientName } = await this.getContextualServices(request);
            console.log("Inside deleting the intent for ", clientName);

            const intent = await repository.findByPk(intentId);

            if (!intent) {
                this.responseHandler.sendFailureResponse(response, 404, 'Intent not found');
            }

            await intent.destroy();

            this.responseHandler.sendSuccessResponse(response, 200, 'Intent deleted successfully', null);
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
        ).getRepository(Intents);

        return { clientEnvironmentProvider, clientName, repository };
    }
}
