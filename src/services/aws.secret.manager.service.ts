import AWS from 'aws-sdk';

// Load the AWS SDK
console.log("start---------");

export class AwsSecretsManager {

    async getCrossAccountCredentials() {
        return new Promise((resolve, reject) => {
            const sts = new AWS.STS();
            const timestamp = (new Date()).getTime();
            const params = {
            RoleArn: process.env.RoleArn,
            RoleSessionName: `be-descriptibe-here-${timestamp}`
            };
            sts.assumeRole(params, (err, data) => {
                if (err) reject(err);
                else {
                    resolve({
                    accessKeyId: data.Credentials.AccessKeyId,
                    secretAccessKey: data.Credentials.SecretAccessKey,
                    sessionToken: data.Credentials.SessionToken,
                    });
                }
            });
        });
    }

    async getSecrets() {

        let responseCredentials:any = await this.getCrossAccountCredentials();
        let region = process.env.region;
        let secretNameList = process.env.secretNameList.split(',');
        let secretObjectList = [];
        var client = new AWS.SecretsManager({region: region, accessKeyId: responseCredentials.accessKeyId, secretAccessKey:responseCredentials.secretAccessKey, sessionToken: responseCredentials.sessionToken});

        // var params = {
        //     Filters: [
        //         {
        //             Key: "tag-key",
        //             Values: [
        //                 'rean'
        //             ]
        //         },
        //         {
        //             Key: "tag-value",
        //             Values: [
        //                 'SaaS'
        //             ]
        //         }
        //     ]
        // };
        var error;

        //--------Once the limitation of Duplo os resolved, we will apply this block of code below to get the list of secrests--------
        //Get the list of Secrets in Secrets Manager
        // let responseSecretList = await client.listSecrets(params).promise().catch(err => (error = err));
        // console.log("responseSecretList", responseSecretList)
        // for (const ele of responseSecretList.SecretList) {
        //     secretNameList.push(ele.Name);
        // }
        //----------------------------------------------------------------------------------------------------------------------------

        // For the list of secrets, get the respective values and store as list of objects
        for (const ele of secretNameList) {
            // console.log("secretName", ele);
            let responseSecretValue = await client.getSecretValue({ SecretId: ele }).promise().catch(err => (error = err));
            let secretStringToObj = JSON.parse(responseSecretValue.SecretString);
            secretObjectList.push(secretStringToObj);
        }

        return secretObjectList;
    }
}
