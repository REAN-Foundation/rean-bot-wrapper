import type { MessagingConfig, MessagingProvider } from '../domain.types/events/provider.types.js';
import * as configuration from '../../reancare.config.json' with { type: "json" };
import type {
    Configurations,
    DatabaseType,
    DatabaseORM,
    DatabaseFlavour,
    EHRProvider,
    EHRSpecification,
    AuthenticationType,
    AuthorizationType,
    SecretsProvider
} from './configs.js';

export class ConfigurationManager {

    static _config: Configurations = null;

    public static loadConfigurations = (): void => {

        ConfigurationManager._config = {
            Auth : {
                Authentication : configuration.default.Auth.Authentication as AuthenticationType,
                Authorization  : configuration.default.Auth.Authorization as AuthorizationType,
            },
            Database : {
                Type    : configuration.default.Database.Type as DatabaseType,
                ORM     : configuration.default.Database.ORM as DatabaseORM,
                Flavour : configuration.default.Database.Flavour as DatabaseFlavour,
            },
            Ehr : {
                Specification : configuration.default.Ehr.Specification as EHRSpecification,
                Provider      : configuration.default.Ehr.Provider as EHRProvider,
            },
            Messaging : {
                Provider : configuration?.default.Messaging?.Provider as MessagingProvider,
                Events   : {
                    Enabled                : configuration?.default.Messaging?.Events?.Enabled,
                    RetryPolicy            : configuration?.default.Messaging?.Events?.RetryPolicy,
                    DeadLetterQueue        : configuration?.default.Messaging?.Events?.DeadLetterQueue,
                    MessageRetentionPeriod : configuration?.default.Messaging?.Events?.MessageRetentionPeriod,
                    VisibilityTimeout      : configuration?.default.Messaging?.Events?.VisibilityTimeout,
                },
            },
            SecretsManager : {
                Provider : configuration?.default.SecretsManager?.Provider as SecretsProvider,
            },
            MaxUploadFileSize : configuration.default.MaxUploadFileSize,

        };

        ConfigurationManager.checkConfigSanity();
    };

    public static Authentication = (): AuthenticationType => {
        return ConfigurationManager._config.Auth.Authentication;
    };

    public static Authorization = (): AuthorizationType => {
        return ConfigurationManager._config.Auth.Authorization;
    };

    public static DatabaseType = (): DatabaseType => {
        return ConfigurationManager._config.Database.Type;
    };

    public static DatabaseORM = (): DatabaseORM => {
        return ConfigurationManager._config.Database.ORM;
    };

    public static DatabaseFlavour = (): DatabaseFlavour => {
        return ConfigurationManager._config.Database.Flavour;
    };

    public static EhrSpecification = (): EHRSpecification => {
        return ConfigurationManager._config.Ehr.Specification;
    };

    public static EhrProvider = (): EHRProvider => {
        return ConfigurationManager._config.Ehr.Provider;
    };

    public static MaxUploadFileSize = (): number => {
        return ConfigurationManager._config.MaxUploadFileSize;
    };

    public static MessagingProvider = (): MessagingProvider => {
        return ConfigurationManager._config.Messaging.Provider;
    };

    public static MessagingConfig = (): MessagingConfig => {
        return ConfigurationManager._config.Messaging;
    };

    public static SecretsProvider = (): SecretsProvider => {
        return ConfigurationManager._config.SecretsManager.Provider;
    };

    private static checkConfigSanity() {

        //Check database configurations

        if (ConfigurationManager._config.Database.Type === 'SQL') {
            var orm = ConfigurationManager._config.Database.ORM;
            var flavour = ConfigurationManager._config.Database.Flavour;
            if (orm !== 'Sequelize' && orm !== 'Knex') {
                throw new Error('Database configuration error! - Unspported/non-matching ORM');
            }
            if (flavour !== 'MySQL' && flavour !== 'PostGreSQL') {
                throw new Error('Database configuration error! - Unspported/non-matching databse flavour');
            }
        }
        if (ConfigurationManager._config.Database.Type === 'NoSQL') {
            var orm = ConfigurationManager._config.Database.ORM;
            var flavour = ConfigurationManager._config.Database.Flavour;
            if (flavour === 'MongoDB') {
                if (orm !== 'Mongoose') {
                    throw new Error('Database configuration error! - Unspported/non-matching ORM');
                }
            }
        }
    }

}
