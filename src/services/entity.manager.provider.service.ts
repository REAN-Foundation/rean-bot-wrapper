import {container, Lifecycle, scoped } from "tsyringe";
import { SequelizeClient } from "../connection/sequelizeClient";

@scoped(Lifecycle.ContainerScoped)
export  class EntityManagerProvider{

    getEntityManager = async (clientEnvironmentPrviderService,clientName) => {
        console.log("DB client name: "+ clientName);
        // eslint-disable-next-line max-len
        const sequelizeClient = container.resolve(SequelizeClient);
        const sequelize =  await sequelizeClient.getSequelizeClient(clientEnvironmentPrviderService,clientName);
        return sequelize;
    };

}
