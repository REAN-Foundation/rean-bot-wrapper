import { ResponseHandler } from '../../utils/response.handler';
import { autoInjectable, container } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { AwsS3manager } from '../../services/aws.file.upload.service';
@autoInjectable()
export class kobotoolboxController{
    constructor(
        private responseHandler?: ResponseHandler,
        private clientEnvironment?: ClientEnvironmentProviderService,
        private awss3manager?: AwsS3manager) {

    }

    private reformed_data = {}

    async getKeys(req,file_name){
        const client_name = req.params.client;
        const folder_name = req.params.form_name;
        const getFileKey = `${client_name}/${folder_name}/datastructure/datastructure.json`;
        const uploadFileKey = `${client_name}/${folder_name}/data/${file_name}.json`;
        return [getFileKey, uploadFileKey];
    }

    async getdatastructure(getFileKey){
        const awsfile = await this.awss3manager.getFile(getFileKey);
        const datastructure = JSON.parse(awsfile.Body.toString('utf-8'));
        console.log("data structure is ",datastructure);
        return datastructure;
    }

    async restructuring(body,datastructure){
        
        console.log("restricturing function is called");
        const keys = Object.keys(datastructure);
        const length = Object.keys(datastructure).length;
        for (let i = 0, len = length ; i < len; i++) {
            if (body[keys[i]]){
                this.reformed_data[datastructure[keys[i]]["new_name"]]= body[keys[i]];
            }
            try {
                if (this.reformed_data[datastructure[keys[i]]["new_name"]] !== null ) {
                    console.log("bot altered");
                }
                
            } catch (error) {

                this.reformed_data[datastructure[keys[i]]["new_name"]]= "null";
            }

        }
        console.log("reformed_Data ",this.reformed_data);
        return this.reformed_data;
    }

kobotoolbox = async(req, res)=>{
    console.log(req.body);
    const fileName = req.body["_id"];
    const [getFileKey, uploadFileKey] = await this.getKeys(req,fileName);
    const datastructure = await this.getdatastructure(getFileKey);
    const data = await this.restructuring(req.body,datastructure);
    await this.awss3manager.uploadKoboData(uploadFileKey,data);
    this.responseHandler.sendSuccessResponse(res, 200, 'Message is sent successfully!', "");

}
}
