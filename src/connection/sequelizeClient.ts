import { Sequelize } from 'sequelize-typescript';
import { autoInjectable, singleton } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model.js';
import { ChatSession } from '../models/chat.session.js';
import { ContactList } from '../models/contact.list.js';
import { MessageStatus } from '../models/message.status.js';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service.js';
import { CalorieInfo } from '../models/calorie.info.model.js';
import { CalorieDatabase } from '../models/calorie.db.model.js';
import { AssessmentSessionLogs } from '../models/assessment.session.model.js';
import { ConsentInfo } from '../models/consent.info.model.js';
import { UserConsent } from '../models/user.consent.model.js';
import { UserInfo } from '../models/user.info.model.js';
import { Logger } from '../../src/common/logger.js';
import WorkflowUserData from '../models/workflow.user.data.model.js';
import { ReminderMessage } from '../models/reminder.model.js';
import { Intents } from '../models/intents/intents.model.js';
import { SystemGeneratedMessages } from '../models/system.generated.messages.model.js';
import { AssessmentIdentifiers } from '../models/assessment/assessment.identifiers.model.js';

//////////////////////////////////////////////////////////////////////////////////////

const sequrlizeClients = new Map<string, Sequelize>();

//////////////////////////////////////////////////////////////////////////////////////

@autoInjectable()
@singleton()
export class SequelizeClient {

    public connect = async(clientEnvironmentProviderService) => {
        const databaseName = await clientEnvironmentProviderService.getClientEnvironmentVariable("DATA_BASE_NAME");
        if (databaseName){
            const dbName = databaseName;
            const dbPassword = await clientEnvironmentProviderService.getClientEnvironmentVariable("DB_PASSWORD");
            const dbUser = await clientEnvironmentProviderService.getClientEnvironmentVariable("DB_USER_NAME");
            const dbHost = await clientEnvironmentProviderService.getClientEnvironmentVariable("DB_HOST");
            console.log("DB Connection Details:", dbName, dbUser, dbHost);
            const sequelizeClient = new Sequelize(dbName, dbUser, dbPassword, {
                host           : dbHost,
                dialect        : 'mysql',
                port           : 3306,
                logging        : false,
                repositoryMode : true
            });

            if (await clientEnvironmentProviderService.getClientEnvironmentVariable('NAME') === "CALORIE_BOT") {
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
                    UserInfo,
                    ReminderMessage,
                    Intents,
                    SystemGeneratedMessages,
                    AssessmentIdentifiers
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
        const clientName = await clientEnvironmentVariable.getClientEnvironmentVariable("NAME");
        console.log("Client Name for DB Connection:", clientName);
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
