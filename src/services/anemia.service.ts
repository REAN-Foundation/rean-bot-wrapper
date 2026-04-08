import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { AwsS3manager } from './aws.file.upload.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { EntityManagerProvider } from './entity.manager.provider.service';
import needle from "needle";
import path from 'path';
import { CacheMemory } from "./cache.memory.service";
import { getRequestOptions } from '../utils/helper';
import { sendExtraMessages } from './send.extra.messages.service';

@scoped(Lifecycle.ContainerScoped)
export class AnemiaModelCommunication {

    // eslint-disable-next-line max-len
    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(sendExtraMessages) private sendExtraMessagesobj? : sendExtraMessages,
    ) { }

    async Segmentation(eventObj) {
        const cloudFrontPath = eventObj.body.queryResult.queryText;
        const filename = path.basename(cloudFrontPath);
        await this.fileBackup(eventObj.body,cloudFrontPath,filename );
        const segmentedImageUrl = await this.getSegmentedImage(cloudFrontPath,filename);
        this.sendExtraMessagesobj.sendSecondaryButtonMessage(segmentedImageUrl, "AnemiaYes", "AnemiaNo",  eventObj);

    }

    async fileBackup(Body,cloudFrontPath,filename ){
        try {
            const uniqueId = Body.originalDetectIntentRequest.payload.location;
            const userId = Body.body.originalDetectIntentRequest.payload.userId;
            const filePath =  `./photo/` + filename;
            const newFilename = `${uniqueId}:${userId}`;
            const bucket_name  = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("AnemiaDataBackupBucketName");
            this.awsS3manager.uploadFileToS3(filePath, bucket_name, cloudFrontPath, newFilename);
            CacheMemory.set(`Anemia:${userId}`,newFilename );
        } catch (error) {
            console.log("error which backing up the file");
        }
    }

    async getSegmentedImage(cloudFrontPath,filename){
        const baseUrl = process.env.ANEMIA_SERVICE_BASE_URL;
        const apiUrl = baseUrl + "segment";
        const apiKey = process.env.ANEMIA_SERVICE_API_KEY;
        const options = await getRequestOptions();
        options.headers["Authorization"] = `Bearer ${apiKey}`;
        options.headers["Content-Type"] = `application/json`;
        const obj = {
            "path": cloudFrontPath,
            "FileName": filename
        };
        const response = await needle("POST", apiUrl, obj, options);
        return response.imageURL; 

    }

    async Download(){
        console.log("to download image");
    }

}
