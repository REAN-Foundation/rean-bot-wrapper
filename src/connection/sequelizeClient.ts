import { Sequelize } from 'sequelize-typescript';
import { autoInjectable, singleton } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { MessageStatus } from '../models/message.status';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service';
import { CalorieInfo } from '../models/calorie.info.model';
import { CalorieDatabase } from '../models/calorie.db.model';
import { AssessmentSessionLogs } from '../models/assessment.session.model';
import { ConsentInfo } from '../models/consent.info.model';
import { UserConsent } from '../models/user.consent.model';
const sequrlizeClients = new Map<string, Sequelize>();
@autoInjectable()
@singleton()
export class SequelizeClient {

    public connect = async(clientEnvironmentProviderService) => {
        if (clientEnvironmentProviderService.getClientEnvironmentVariable("DATA_BASE_NAME")){
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
                sequelizeClient.addModels([ChatMessage, ChatSession, ContactList, CalorieInfo, CalorieDatabase,ConsentInfo,UserConsent]);
            } else {
                sequelizeClient.addModels([
                    ChatMessage,
                    ChatSession,
                    ContactList,
                    AssessmentSessionLogs,
                    ConsentInfo,
                    UserConsent,
                    MessageStatus
                ]);
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
        }
        else {
            console.log("No DB to connect");
        }
        
    };

    // eslint-disable-next-line max-len
    getSequelizeClient = async(clientEnvironmentVariable: ClientEnvironmentProviderService):Promise<Sequelize> => {
        const clientName = clientEnvironmentVariable.getClientEnvironmentVariable("NAME");
        console.log("DB client name: " + clientName);
        if (sequrlizeClients[clientName]) {
            console.log("returning existing client", clientName);
            return sequrlizeClients[clientName];
        }
        else {
            console.log("New Client Connected", clientName);
            sequrlizeClients[clientName] = await this.connect(clientEnvironmentVariable);
            return sequrlizeClients[clientName];
        }
    };
    
}
