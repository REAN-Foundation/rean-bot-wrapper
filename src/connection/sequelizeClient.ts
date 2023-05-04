import { Sequelize } from 'sequelize-typescript';
import { UserFeedback } from '../models/user.feedback.model';
import { autoInjectable, singleton } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service';
import { CalorieInfo } from '../models/calorie.info.model';
import { CalorieDatabase } from '../models/calorie.db.model';
const sequrlizeClients = new Map<string, Sequelize>();
@autoInjectable()
@singleton()
export class SequelizeClient {

    public connect = async(clientEnvironmentProviderService) => {
        
        const dbName = clientEnvironmentProviderService.getClientEnvironmentVariable("DATA_BASE_NAME");
        const dbPassword = clientEnvironmentProviderService.getClientEnvironmentVariable("DB_PASSWORD");
        const dbUser = clientEnvironmentProviderService.getClientEnvironmentVariable("DB_USER_NAME");
        const dbHost = clientEnvironmentProviderService.getClientEnvironmentVariable("DB_HOST");
        const sequelizeClient = new Sequelize(dbName, dbUser, dbPassword, {
            host           : dbHost,
            dialect        : 'mysql',
            port           : 3306,
            logging        : false,
            repositoryMode : true
        });
        
        if (clientEnvironmentProviderService.getClientEnvironmentVariable('NAME') === "CALORIE_BOT") {
            // eslint-disable-next-line max-len
            sequelizeClient.addModels([ChatMessage, UserFeedback, ChatSession, ContactList, CalorieInfo, CalorieDatabase]);
        } else {
            sequelizeClient.addModels([ChatMessage, UserFeedback, ChatSession, ContactList]);
        }

        await sequelizeClient.authenticate()
            .then(async () => {
                try {
                    console.log("MySQL DB connected");
                }
                catch (error) {
                    console.log("err", error);
                }
            })
            .catch(error => console.log("DB connection failed", error));
        await sequelizeClient.sync({ alter: false });
        return sequelizeClient;
    };

    // eslint-disable-next-line max-len
    getSequelizeClient = async(getClientEnvironmentVariable: ClientEnvironmentProviderService,clientName):Promise<Sequelize> => {
        if (sequrlizeClients[clientName]) {
            console.log("returning existing client", clientName);
            return sequrlizeClients[clientName];
        }
        else {
            console.log("New Client Connected", clientName);
            sequrlizeClients[clientName] = await this.connect(getClientEnvironmentVariable);
            return sequrlizeClients[clientName];
        }
    };
    
}
