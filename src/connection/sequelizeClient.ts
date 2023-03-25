import { Sequelize } from 'sequelize-typescript';
import { UserFeedback } from '../models/user.feedback.model';
import { autoInjectable, scoped, Lifecycle } from 'tsyringe';
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service';
import { CalorieInfo } from '../models/calorie.info.model';
import { CalorieDatabase } from '../models/calorie.db.model';

@autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class SequelizeClient {

    constructor(private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    public _sequelize: Sequelize = null;

    public connect = async() => {

        const dbName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DATA_BASE_NAME");
        const dbPassword = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DB_PASSWORD");
        const dbUser = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DB_USER_NAME");
        const dbHost = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DB_HOST");
        const sequelizeClient = new Sequelize(dbName, dbUser, dbPassword, {
            host    : dbHost,
            dialect : 'mysql',
            port    : 3306,
            logging : false
        });
        
        if (this.clientEnvironmentProviderService.getClientEnvironmentVariable('NAME') === "CALORIE_BOT") {
            // eslint-disable-next-line max-len
            sequelizeClient.addModels([ChatMessage, UserFeedback, ChatSession, ContactList, CalorieInfo, CalorieDatabase]);
        } else {
            sequelizeClient.addModels([ChatMessage, UserFeedback, ChatSession, ContactList]);
        }

        // ChatSession.hasMany(ChatMessage);
        // ChatMessage.belongsTo(ChatSession);
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
        await this._sequelize.sync({ alter: false });
    };
    
}
