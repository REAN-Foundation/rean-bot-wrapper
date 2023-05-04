import {container, Lifecycle, scoped } from "tsyringe";
import { SequelizeClient } from "../connection/sequelizeClient";

@scoped(Lifecycle.ContainerScoped)
export  class EntityManagerProvider{

    getEntityManager = async (clientEnvironmentPrviderService) => {
        const sequelizeClient = container.resolve(SequelizeClient);
        const clientName = clientEnvironmentPrviderService.getClientEnvironmentVariable("NAME");
        console.log("DB client name: "+ clientName + " schema is: " + clientEnvironmentPrviderService.getClientEnvironmentVariable("DATA_BASE_NAME"));
        // eslint-disable-next-line max-len
        const sequelize =  await sequelizeClient.getSequelizeClient(clientEnvironmentPrviderService,clientName);
        return sequelize;
    };

}
