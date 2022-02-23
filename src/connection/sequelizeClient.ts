import { Sequelize } from 'sequelize-typescript';
import { UserFeedback } from '../models/user.feedback.model';
import { autoInjectable } from 'tsyringe';
import { UserRequest } from '../models/user.request.model';
import { UserResponse } from '../models/user.response.model';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service';

@autoInjectable()
export class SequelizeClient {

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    public _sequelize: Sequelize = null;

    public connect = async() => {

        const dbName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DATA_BASE_NAME");
        const dbPassword = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DB_PASSWORD");
        const dbUser = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DB_USER_NAME");
        const sequelizeClient = new Sequelize(dbName, dbUser, dbPassword, {
            host : 'localhost',
            dialect : 'mysql'
        });
        sequelizeClient.addModels([UserRequest, UserResponse, UserFeedback]);
        this._sequelize = sequelizeClient;

        await this._sequelize.authenticate()
            .then(async () => {
                try {
                    console.log("MySQL DB connected");
                }
                catch (error) {
                    console.log("err", error);
                }
            })
            .catch(error => console.log("DB connection failed", error));
        await this._sequelize.sync({ alter: true });
    };
    
}
