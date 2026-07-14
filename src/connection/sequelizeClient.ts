import { Sequelize } from 'sequelize-typescript';
import { autoInjectable, singleton } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model';
import { ChatMessageSensitivity } from '../models/chat.message.sensitivity.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { BlockList } from '../models/block.list.model';
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
import { ReminderMessage } from '../models/reminder.model';
import { Intents } from '../models/intents/intents.model';
import { SystemGeneratedMessages } from '../models/system.generated.messages.model';
import { AssessmentIdentifiers } from '../models/assessment/assessment.identifiers.model';
import { AnemiaDataRecord } from '../models/anemia.data.model';

//////////////////////////////////////////////////////////////////////////////////////

const sequrlizeClients = new Map<string, Sequelize>();

//////////////////////////////////////////////////////////////////////////////////////

@autoInjectable()
@singleton()
export class SequelizeClient {

    static resolveDialect(value?: string): 'mysql' | 'postgres' {
        console.log("DB_DIALECT", value);
        return 'postgres';

        // if (!value || !value.trim()) {
        //     throw new Error('DB_DIALECT is required. Set it to "mysql" or "postgres".');
        // }
        // const dialect = value.trim().toLowerCase();
        // switch (dialect) {
        // case 'mysql':
        //     return 'mysql';
        // case 'postgres':
        // case 'postgresql':
        // case 'pg':
        //     return 'postgres';
        // default:
        //     throw new Error(`Unsupported DB_DIALECT "${value}". Use "mysql" or "postgres".`);
        // }
    }

    static resolvePort(value?: string): number {
        console.log("DB_PORT", value);
        return 5432; // Default port for PostgreSQL
        // if (!value || !value.trim()) {
        //     throw new Error('DB_PORT is required. Set it to the database port (e.g. 3306 for mysql, 5432 for postgres).');
        // }
        // const port = parseInt(value.trim(), 10);
        // if (Number.isNaN(port) || port <= 0) {
        //     throw new Error(`Invalid DB_PORT "${value}". It must be a positive integer.`);
        // }
        // return port;
    }

    public connect = async(clientEnvironmentProviderService) => {
        const databaseSecrets = await clientEnvironmentProviderService.getClientEnvironmentVariable("database");
        const databaseName = databaseSecrets?.DataBaseName;
        if (databaseName){
            const dbName = databaseName;
            const dbPassword = process.env.DB_PASSWORD;
            const dbUser = process.env.DB_USER_NAME;
            const dbHost = process.env.DB_HOST;
            const dbDialect = SequelizeClient.resolveDialect(process.env.DB_DIALECT);
            const dbPort = SequelizeClient.resolvePort(process.env.DB_PORT);
            const sequelizeClient = new Sequelize(dbName, dbUser, dbPassword, {
                host           : dbHost,
                dialect        : dbDialect,
                port           : dbPort,
                logging        : false,
                repositoryMode : true
            });

            if (await clientEnvironmentProviderService.getClientEnvironmentVariable('Name') === "CALORIE_BOT") {
                // eslint-disable-next-line max-len
                sequelizeClient.addModels([ChatMessage, ChatSession, ContactList, CalorieInfo, CalorieDatabase,ConsentInfo,UserConsent]);
            } else {
                sequelizeClient.addModels([
                    ChatMessage,
                    ChatMessageSensitivity,
                    ChatSession,
                    ContactList,
                    BlockList,
                    AssessmentSessionLogs,
                    ConsentInfo,
                    UserConsent,
                    MessageStatus,
                    WorkflowUserData,
                    UserInfo,
                    ReminderMessage,
                    Intents,
                    SystemGeneratedMessages,
                    AssessmentIdentifiers,
                    AnemiaDataRecord
                ]);
            }

            await sequelizeClient.authenticate()
                .then(async () => {
                    try {
                        Logger.instance().log(`${dbDialect.toUpperCase()} DB Connected`);
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
        try {
            const clientName = await clientEnvironmentVariable.getClientEnvironmentVariable("Name");
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
        } catch (error) {
            console.error(`Error in getSequelizeClient for client ${await clientEnvironmentVariable.getClientEnvironmentVariable("Name")}:`, error);

            // throw error; // Rethrow the error after logging it
        }

    };

}
