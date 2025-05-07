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
import { UserInfo } from '../models/user.info.model';
import { Logger } from '../../src/common/logger';
import WorkflowUserData from '../models/workflow.user.data.model';
import { Intents } from '../models/intents/intents.model';

//////////////////////////////////////////////////////////////////////////////////////

const sequrlizeClients = new Map<string, Sequelize>();

//////////////////////////////////////////////////////////////////////////////////////

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
                    MessageStatus,
                    WorkflowUserData,
                    Intents
                ]);
            }

            await sequelizeClient.authenticate()
                .then(async () => {
                    try {
                        Logger.instance().log('MYSQL DB Connected');
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
        if (sequrlizeClients[clientName]) {
            Logger.instance().log(`Returning existing client DB for: ${clientName}`);
            return sequrlizeClients[clientName];
        }
        else {
            Logger.instance().log(`Created a new client DB for: ${clientName}`);
            sequrlizeClients[clientName] = await this.connect(clientEnvironmentVariable);
            return sequrlizeClients[clientName];
        }
    };

}
