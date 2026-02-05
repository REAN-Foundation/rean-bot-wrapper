import { container, DependencyContainer } from "tsyringe";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import { EntityManagerProvider } from "../entity.manager.provider.service";
import { Logger } from "../../common/logger";

export class ContainerService {

    static createChildContainer = (clientName: string): DependencyContainer => {
        try {
            const childContainer = container.createChildContainer();
            childContainer.register("ClientEnvironmentProviderService", ClientEnvironmentProviderService);
            childContainer.resolve(ClientEnvironmentProviderService).setClientName(clientName);
            childContainer.register("EntityManagerProvider", EntityManagerProvider);
            return childContainer;
        } catch (error) {
            Logger.instance().log(error.message);
            return null;
        }
    };

}
