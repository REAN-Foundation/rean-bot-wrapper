import { ResponseHandler } from '../../utils/response.handler';
import { autoInjectable, inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { AwsS3manager } from '../../services/aws.file.upload.service';

// @autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class kobotoolboxController{
    
    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awss3manager?: AwsS3manager
    ) {

    }

    private reformedData = {};

    async getKeys(req,fileName){
        const clientName = req.params.client;
        const folderName = req.params.form_name;
        const getFileKey = `${clientName}/${folderName}/datastructure/datastructure.json`;
        const uploadFileKey = `${clientName}/${folderName}/data/${fileName}.json`;
        return [getFileKey, uploadFileKey];
    }

    async getdatastructure(getFileKey){
        const awsFile = await this.awss3manager.getFile(getFileKey);
        const datastructure = JSON.parse(awsFile.Body.toString('utf-8'));
        console.log("data structure is ",datastructure);
        return datastructure;
    }

    async restructuring(body,datastructure){
        
        console.log("restricturing function is called");
        const keys = Object.keys(datastructure);
        const length = Object.keys(datastructure).length;
        for (let i = 0, len = length ; i < len; i++) {
            if (body[keys[i]]){
                this.reformedData[datastructure[keys[i]]["new_name"]] = body[keys[i]];
            }
            try {
                if (this.reformedData[datastructure[keys[i]]["new_name"]] !== null ) {
                    console.log("bot altered");
                }
                
            } catch (error) {

                this.reformedData[datastructure[keys[i]]["new_name"]] = "null";
            }

        }
        console.log("reformed_Data ",this.reformedData);
        return this.reformedData;
    }

    kobotoolbox = async(req, res)=>{
        console.log(req.body);
        const fileName = req.body["_id"];
        const [getFileKey, uploadFileKey] = await this.getKeys(req,fileName);
        const datastructure = await this.getdatastructure(getFileKey);
        const data = await this.restructuring(req.body,datastructure);
        await this.awss3manager.uploadKoboData(uploadFileKey,data);
        this.responseHandler.sendSuccessResponse(res, 200, 'Message is sent successfully!', "");

    };
}
