import AWS from 'aws-sdk';
import { EnvVariableCache } from '../cache/env.variable.cache';


export class EnvSecretManager {

    public static _tenantsList: string[] = [];

    public static _useCache = process.env.USE_ENV_CACHE === 'true' ? true : false;
    
    public static get tenants(): string[] {
        return this._tenantsList;
    }

    public static populateEnvVariables = async () => {
        if (process.env.ENVIRONMENT === 'LOCAL'){
            await this.populateEnvVariables_Local();
        } else {
            await this.populateEnvVariables_AWSSecretManager();
        }
    };

    public static getCrossAccountCredentials = async() => {

        return new Promise((resolve, reject) => {

            const sts = new AWS.STS();
            const timestamp = (new Date()).getTime();
            const params = {
                RoleArn         : process.env.ROLE_ARN,
                RoleSessionName : `STS-Session-${timestamp}`
            };
            sts.assumeRole(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        acessKeyId     : data.Credentials.AccessKeyId,
                        secretAcessKey : data.Credentials.SecretAccessKey,
                        sessionToken   : data.Credentials.SessionToken
                    });
                }
            });
        });
    };

    public static getSecrets = async () => {

        const responseCredentials: any = await this.getCrossAccountCredentials();
        const region = process.env.region;
        const secretNameList = process.env.SECRET_NAME_LIST.split(',');
        const secretObjectList = [];

        const client = new AWS.SecretsManager(
            {
                region          : region,
                accessKeyId     : responseCredentials.accessKeyId,
                secretAccessKey : responseCredentials.secretAccessKey,
                sessionToken    : responseCredentials.sessionToken
            }
        );

        let error: any = undefined;
        for ( const ele of secretNameList ) {
            const responseSecretValue = await client.getSecretValue({ SecretId: ele })
                .promise()
                .catch(err => ( error = err ));
            const secretsStringToObj = JSON.parse(responseSecretValue.SecretString);
            secretObjectList.push(secretsStringToObj);
        }

        return secretObjectList;
    }

    private static populateEnvVariables_AWSSecretManager = async() => {
        try {
            const secretObjectList = await this.getSecrets();
            for ( const ele of secretObjectList ) {
                if (!ele.NAME) {
                    for (const k in ele) {
                        if (typeof ele[k] === "object"){
                            process.env[k.toUpperCase()] = JSON.stringify(ele[k]);
                        }
                        else {
                            process.env[k.toUpperCase()] = ele[k];
                        }
                    }
                } else {
                    this._tenantsList.push(ele.NAME);
                    for (const k in ele) {
                        if (typeof ele[k] === "object") {
                            this.storeEnvVariable(ele.NAME, k.toUpperCase(), JSON.stringify(ele[k]));
                        } else {
                            this.storeEnvVariable(ele.NAME, k.toUpperCase(), ele[k]);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Error while loading env variables " + e);
        }
    };

    private static populateEnvVariables_Local = async () => {
        try {
            const secretNameList = process.env.secretNameList.split(',');
            const secretObjectList = [];
            for (const element of secretNameList) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const responseSecretValue = require(`${process.cwd()}/${element}.json`);
                const secretStringToObj = responseSecretValue;
                secretObjectList.push(secretStringToObj);
            }
            for (const ele of secretObjectList) {
                if (!ele.NAME) {
                    for (const k in ele) {
                        if (typeof ele[k] === "object"){
                            process.env[k.toUpperCase()] = JSON.stringify(ele[k]);
                        }
                        else {
                            process.env[k.toUpperCase()] = ele[k];
                        }
                    }
                } else {
                    this._tenantsList.push(ele.NAME);
                    for (const k in ele) {
                        if (typeof ele[k] === "object") {
                            this.storeEnvVariable(ele.NAME, k.toUpperCase(), JSON.stringify(ele[k]));
                        } else {
                            this.storeEnvVariable(ele.NAME, k.toUpperCase(), ele[k]);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Error while creating LOCAL env variables " + e.message);
        }
    }

    private static storeEnvVariable = (tenantName: string, envKey: string, value: string): void => {
        if (this._useCache) {
            EnvVariableCache.set(tenantName, envKey, value);
        } else {
            process.env[tenantName + "_" + envKey] = value;
        }
    }
}