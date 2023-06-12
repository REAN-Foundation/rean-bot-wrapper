import { AwsS3manager } from './aws.file.upload.service'
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { autoInjectable, inject, Lifecycle, scoped } from 'tsyringe';
import { ResponseHandler } from '../utils/response.handler';
const needle = require("needle");


@autoInjectable()
export class databackup{
    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awss3manager?: AwsS3manager
    ){}

    async getKeys(clientName){
        const URL = process.env[clientName+ "_" + "URL"];
        const assetIDs = process.env[clientName+ "_" + "ASSET_ID"];
        const myToken = process.env[clientName + "_" + "TOKEN"];
        return [URL,assetIDs,myToken];
    }

    async getData(URL,assetID,myToken){
        const finalURL= `${URL}/${assetID}/data.json`;
        const options: any = {
        };
        const headers = {};
        options.headers = headers;
        options.headers["Authorization"] = `Token ${myToken}`;
        options.headers["Content-Type"] = `application/json`;
        const response = await needle(
            "get",
            finalURL,
            options
        );    
        const response_data = response.body.results;
        return response_data;

    }
    async getdatastructure(getFileKey){
        const awsFile = await this.awss3manager.getFile(getFileKey);
        const datastructure = JSON.parse(awsFile.Body.toString('utf-8'));
        return datastructure;
    }

    async restructuring(rawData,datastructure,formName){ 
        const keys = Object.keys(datastructure);
        const length = Object.keys(datastructure).length;
        for (let i = 0 ; i < rawData.length; i ++){
            const reformedData = {};
            const fileName = rawData[i]._id;
            for (let j = 0, len = length ; j < len; j++) {
                if (rawData[i][keys[j]]){
                    reformedData[datastructure[keys[j]]["new_name"]] = rawData[i][keys[j]];
                }
                else if (reformedData[datastructure[keys[j]]["new_name"]]){
                    console.log("if exist already");
                }
                else {
                    reformedData[datastructure[keys[j]]["new_name"]] = "null";
                }
            }
            const uploadFileKey = `${formName}/Data/${fileName}.json`;
            await this.awss3manager.uploadKoboData(uploadFileKey,reformedData);
            console.log("data is successfully uploaded");
        }  

    }

    async main(clientName){
        const [URL,assetIDs,myToken] = await this.getKeys(clientName);
        for (const [formName, assetID] of Object.entries(JSON.parse(assetIDs))) {
            console.log(`databackup is called for ${clientName} for ${formName}`);
            const rawData = await this.getData(URL,assetID,myToken);
            console.log("data is succefully get");
            const getFileKey = `${formName}/Datastructure/datastructure.json`;
            const datastructure = await this.getdatastructure(getFileKey);
            console.log("datastructure is there");
            await this.restructuring(rawData,datastructure,formName);

        }
    }

}
