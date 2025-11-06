import { ClientEnvironmentProviderService } from "../../services/set.client/client.environment.provider.service.js";
import { EntityManagerProvider } from "../../services/entity.manager.provider.service.js";
import { ApiError } from "../../common/api.error.js";

///////////////////////////////////////////////////////////////////////////////

export class RepositoryHelper {

    static resolveEntityManager = async (container) => {
        try {
            const clientEnvironmentProviderService = await container.resolve(ClientEnvironmentProviderService);
            const clientName = await  clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            const entityManagerProvider = container.resolve(EntityManagerProvider);
            const entityManager = await entityManagerProvider.getEntityManager(
                clientEnvironmentProviderService,clientName
            );
            return entityManager;
        }
        catch (error) {
            console.error('Error resolving entity manager:', error);
            throw new ApiError(500, 'Error resolving entity manager');
        }
    };

}
