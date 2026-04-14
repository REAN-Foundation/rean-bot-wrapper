import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { AwsS3manager } from './aws.file.upload.service';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { AnemiaDataRecord } from '../models/anemia.data.model';
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
        @inject (EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private EnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awsS3manager?: AwsS3manager,
        @inject(sendExtraMessages) private sendExtraMessagesobj? : sendExtraMessages,
    ) { }

    async Segmentation(eventObj) {
        try {
            const cloudFrontPath = eventObj.body.queryResult.queryText;
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const filename = path.basename(cloudFrontPath);
            this.fileBackup(eventObj.body,cloudFrontPath,filename);
            const response = await this. getAnemiaResults(cloudFrontPath,filename,"segment");
            const cacheData = CacheMemory.get(`Anemia:${userId}`);
            cacheData["SegmentedImagePath"] = response.imageURL;
            CacheMemory.set(`Anemia:${userId}`, cacheData );
            this.sendExtraMessagesobj.sendSecondaryButtonMessage(response.imageURL, "AnemiaImageCorrect", "AnemiaImageIncorrect",  eventObj);
    
        } catch (error) {
            console.log("segmentation Service Error");
        }
    }

    async fileBackup(Body,cloudFrontPath,filename ){
        try {
            const uniqueId = Body.originalDetectIntentRequest.payload.location;
            const userId = Body.body.originalDetectIntentRequest.payload.userId;
            const filePath =  `./photo/` + filename;
            const newFilename = `${uniqueId}:${userId}`;
            const bucket_name  = await this.EnvironmentProviderService.getClientEnvironmentVariable("AnemiaDataBackupBucketName");
            const fileLocation =
            await this.awsS3manager.uploadFileToS3(filePath, bucket_name, cloudFrontPath, newFilename);
            const cacheData = {
                "origionalImagePath" : fileLocation,
                "SegmentedImagePath" : "",
                "HbValue"            : 0,
                "patientId"          : ""
            };
            CacheMemory.set(`Anemia:${userId}`, cacheData );
        } catch (error) {
            console.log("error which backing up the file");
        }
    }

    async getAnemiaResults(cloudFrontPath,filename,path){
        try {
            const baseUrl = process.env.ANEMIA_SERVICE_BASE_URL;
            const apiUrl = baseUrl + path;
            const apiKey = process.env.ANEMIA_SERVICE_API_KEY;
            const options = await getRequestOptions();
            options.headers["Authorization"] = `Bearer ${apiKey}`;
            options.headers["Content-Type"] = `application/json`;
            const obj = {
                "path"     : cloudFrontPath,
                "FileName" : filename
            };
            const response = await needle("POST", apiUrl, obj, options);
   
            return response;
        } catch (error) {
            console.log("error while getting result from Anemia Service");
        }

    }

    async Record(userId){
        const cacheData = CacheMemory.get(`Anemia:${userId}`);
        const AnemiaRepoObj =
        (await this.entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(AnemiaDataRecord);
        await AnemiaRepoObj.create({
            userPlatformId     : userId,
            patientId          : cacheData["patientId"],
            pridictedHb        : cacheData["HbValue"],
            originalImagePath  : cacheData["origionalImagePath"],
            segmentedImagePath : cacheData["SegmentedImagePath"]
        }
        );
        CacheMemory.delete(`Anemia:${userId}`);

    }

    async Regression(eventObj){
        const cloudFrontPath = eventObj.body.queryResult.queryText;
        const filename = path.basename(cloudFrontPath);
        const result = await this. getAnemiaResults(cloudFrontPath,filename,"regression");
        const HbValue = result.HbValue;
        const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
        const cacheData = CacheMemory.get(`Anemia:${userId}`);
        cacheData["patientId"] = eventObj.body.queryResult.parameters.patientId;
        cacheData["HbValue"] = HbValue;
        await CacheMemory.set(`Anemia:${userId}`, cacheData );
        this.Record(userId);
        return HbValue;
    }

}
