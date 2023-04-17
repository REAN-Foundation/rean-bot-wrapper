"use strict";

var _process = _interopRequireDefault(require("process"));

var _yargs = require("sequelize-cli/lib/core/yargs");

var _migrator = require("sequelize-cli/lib/core/migrator");

var _helpers = _interopRequireDefault(require("sequelize-cli/lib/helpers"));

var _lodash = _interopRequireDefault(require("lodash"));

var config = require("../src/data/database/sequelize/database.config");

/* eslint-disable @typescript-eslint/no-unused-vars */
const AWS = require('aws-sdk');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.builder = yargs => (0, _yargs._baseOptions)(yargs).option('to', {
  describe: 'Migration name to run migrations until',
  type: 'string'
}).option('from', {
  describe: 'Migration name to start migrations from (excluding)',
  type: 'string'
}).option('name', {
  describe: 'Migration name. When specified, only this migration will be run. Mutually exclusive with --to and --from',
  type: 'string',
  conflicts: ['to', 'from']
}).argv;

exports.handler = async function (args) {
  const params = process.argv.slice(2)
  const env = params[2]
  const newValuesList = await createConfig()
  // console.log("newValues", newValuesList);
  for (let i=0;i<newValuesList.length; i++){
    config[env].username = newValuesList[i].username;
    config[env].database = newValuesList[i].database;
    config[env].password = newValuesList[i].password;
    config[env].dialect = newValuesList[i].dialect;
    config[env].host = newValuesList[i].host;
    config[env].port = newValuesList[i].port;

    // console.log("newValuesList", newValuesList[i]);
    console.log("config2", config);
  
    await _helpers.default.config.init();
  
    // await migrate(args);

    await migrationStatus(args);

    await migrateSchemaTimestampAdd(args);
  }

  _process.default.exit(0);
};

function migrate(args) {
  return (0, _migrator.getMigrator)('migration', args).then(migrator => {
    return (0, _migrator.ensureCurrentMetaSchema)(migrator).then(() => migrator.pending()).then(migrations => {
      const options = {};

      if (migrations.length === 0) {
        _helpers.default.view.log('No migrations were executed, database schema was already up to date.');

        _process.default.exit(0);
      }

      if (args.to) {
        if (migrations.filter(migration => migration.file === args.to).length === 0) {
          _helpers.default.view.log('No migrations were executed, database schema was already up to date.');

          _process.default.exit(0);
        }

        options.to = args.to;
      }

      if (args.from) {
        if (migrations.map(migration => migration.file).lastIndexOf(args.from) === -1) {
          _helpers.default.view.log('No migrations were executed, database schema was already up to date.');

          _process.default.exit(0);
        }

        options.from = args.from;
      }

      return options;
    }).then(options => {
      if (args.name) {
        return migrator.up(args.name);
      } else {
        return migrator.up(options);
      }
    });
  }).catch(e => _helpers.default.view.error(e));
}

function migrationStatus(args) {
  _helpers.default.view.log('args', args);
  return (0, _migrator.getMigrator)('migration', args).then(migrator => {
    _helpers.default.view.log('migrator', migrator);
    return (0, _migrator.ensureCurrentMetaSchema)(migrator).then(() => migrator.executed()).then(migrations => {
      _helpers.default.view.log('migrations', migrations);
      _lodash.default.forEach(migrations, migration => {
        _helpers.default.view.log('up', migration.file);
      });
    }).then(() => migrator.pending()).then(migrations => {
      _helpers.default.view.log('migrations2', migrations);
      _lodash.default.forEach(migrations, migration => {
        _helpers.default.view.log('down', migration.file);
      });
    });
  }).catch(e => _helpers.default.view.error(e));
}

function migrateSchemaTimestampAdd(args) {
  return (0, _migrator.getMigrator)('migration', args).then(migrator => {
    return (0, _migrator.addTimestampsToSchema)(migrator).then(items => {
      if (items) {
        _helpers.default.view.log('Successfully added timestamps to MetaTable.');
      } else {
        _helpers.default.view.log('MetaTable already has timestamps.');
      }
    });
  }).catch(e => _helpers.default.view.error(e));
}

//Uncomment this class before using it in your local machine
// class AwsSecretsManager {

//   async getCrossAccountCredentials() {
//       return new Promise((resolve, reject) => {
//           const sts = new AWS.STS();
//           const timestamp = (new Date()).getTime();
//           const params = {
//               RoleArn         : process.env.ROLE_ARN,
//               RoleSessionName : `be-descriptibe-here-${timestamp}`
//           };
//           sts.assumeRole(params, (err, data) => {
//               if (err) reject(err);
//               else {
//                   resolve({
//                       accessKeyId     : data.Credentials.AccessKeyId,
//                       secretAccessKey : data.Credentials.SecretAccessKey,
//                       sessionToken    : data.Credentials.SessionToken,
//                   });
//               }
//           });
//       });
//   }

//   async getSecrets() {

//       const responseCredentials = await this.getCrossAccountCredentials();
//       const region = process.env.region;
//       const secretNameList = process.env.SECRET_NAME_LIST.split(',');
//       const secretObjectList = [];

//       // eslint-disable-next-line max-len
//       const client = new AWS.SecretsManager({ region: region, accessKeyId: responseCredentials.accessKeyId, secretAccessKey: responseCredentials.secretAccessKey, sessionToken: responseCredentials.sessionToken });

//       let error;

//       // For the list of secrets, get the respective values and store as list of objects
//       for (const ele of secretNameList) {
//           // eslint-disable-next-line max-len
//           const responseSecretValue = await client.getSecretValue({ SecretId: ele }).promise()
//               .catch(err => (error = err));
//           const secretStringToObj = JSON.parse(responseSecretValue.SecretString);
//           secretObjectList.push(secretStringToObj);
//       }

//       return secretObjectList;
//   }
  
// }

const createConfig = async() => {
  const obj = new AwsSecretsManager()
  const secrets = await obj.getSecrets()
  const listSecrets = []
  for (let i = 0; i < secrets.length; i++){
    const database = secrets[i].DATA_BASE_NAME;
    const username = secrets[i].DB_USER_NAME;
    const password = secrets[i].DB_PASSWORD;
    const config = {
      "username": username,
      "password": password,
      "database": database,
      "host": secrets[i].DB_HOST,
      "dialect": "mysql",
      "port": "3306"
    }
    listSecrets.push(config);
    
  }
  return listSecrets;
}
