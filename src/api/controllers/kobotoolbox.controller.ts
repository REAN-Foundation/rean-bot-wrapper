import { ResponseHandler } from '../../utils/response.handler';
import { inject, Lifecycle, scoped } from 'tsyringe';
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

    async getKeys(req,filename){
        const clientName = req.params.client;
        const datastructureFileKey = `${clientName}/datastructure/datastructure.json`;
        const uploadFileKey = `${clientName}/CSV/${filename}`;
        return [datastructureFileKey,uploadFileKey];
    }

    async getdatastructure(getFileKey){
        const awsFile = await this.awss3manager.getFile(getFileKey);
        const datastructure = JSON.parse(awsFile.Body);
        return datastructure;
    }

    kobotoolbox = async(req, res)=>{
        const filename = this.clientEnvironment.getClientEnvironmentVariable("S3_KOBO_FILENAME");
        const [datastructureFileKey,dataFileKey] = await this.getKeys(req,filename);
        const datastructure = await this.getdatastructure(datastructureFileKey);
        await this.awss3manager.uploadKoboData(dataFileKey,req.body, datastructure);
        this.responseHandler.sendSuccessResponse(res, 200, 'Message is sent successfully!', "");

    };
    
}
