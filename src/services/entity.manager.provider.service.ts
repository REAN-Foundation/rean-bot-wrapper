import {container, Lifecycle, scoped } from "tsyringe";
import { SequelizeClient } from "../connection/sequelizeClient";

@scoped(Lifecycle.ContainerScoped)
export  class EntityManagerProvider{

    getEntityManager = async (clientEnvironmentPrviderService) => {
        const sequelizeClient = container.resolve(SequelizeClient);
        const sequelize =  await sequelizeClient.getSequelizeClient(clientEnvironmentPrviderService);
        return sequelize;
    };

}
