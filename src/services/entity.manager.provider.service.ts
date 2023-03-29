import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { SequelizeClient } from "../connection/sequelizeClient";

@scoped(Lifecycle.ContainerScoped)
export  class EntityManagerProvider{

    // eslint-disable-next-line max-len
    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironmentPrviderService?: ClientEnvironmentProviderService,
    @inject(SequelizeClient) private sequelizeClient?: SequelizeClient){
        
    }

    getEntityManager = async () => {
        const sequelize =  await this.sequelizeClient.getSequelizeClient(this.clientEnvironmentPrviderService);
        return sequelize;
    }
}