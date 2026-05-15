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
            const signedUrl = eventObj.body.originalDetectIntentRequest.payload.completeMessage.imageUrl;
            const cloudFrontPath = eventObj.body.queryResult.queryText;
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const filename = path.basename(cloudFrontPath);
            await this.fileBackup(eventObj.body,cloudFrontPath,filename);
            const response = await this.getAnemiaResults(signedUrl, filename, "segment");
            const imageURL = response?.body?.segmented_image_url;
            if (!imageURL) {
                console.log("Segmentation failed: no imageURL in response");
                return;
            }
            const cacheData = await CacheMemory.get(`Anemia:${userId}`);
            if (!cacheData) {
                console.log(`Segmentation: cache missing for user ${userId} (fileBackup likely failed)`);
                return;
            }
            cacheData["SegmentedImagePath"] = imageURL;
            CacheMemory.set(`Anemia:${userId}`, cacheData);
            this.sendExtraMessagesobj.sendSecondaryButtonMessage(imageURL, "AnemiaImageCorrect", "AnemiaImageIncorrect", eventObj);
    
        } catch (error) {
            console.log("segmentation Service Error");
        }
    }

    async fileBackup(Body,cloudFrontPath,filename ){
        try {
            const uniqueId = Body.originalDetectIntentRequest.payload.location;
            const userId = Body.originalDetectIntentRequest.payload.userId;
            const filePath =  `./photo/` + filename;
            const newFilename = `${uniqueId}:${userId}`;
            const bucket_name  = await this.EnvironmentProviderService.getClientEnvironmentVariable("AnemiaDataBackupBucketName");
            const fileLocation =
            await this.awsS3manager.uploadFileToS3(filePath, bucket_name, cloudFrontPath, newFilename);
            const cacheData = {
                "origionalImagePath" : fileLocation,
                "SegmentedImagePath" : "",
                "HbValue"            : 0,
                "patientId"          : "",
                "age"                : "",
                "gender"             : ""
            };
            CacheMemory.set(`Anemia:${userId}`, cacheData );
        } catch (error) {
            console.log("error which backing up the file");
        }
    }

    async getAnemiaResults(cloudFrontPath, filename, apiPath, age?: string, gender?: string){
        try {
            const baseUrl = process.env.ANEMIA_SERVICE_BASE_URL ?? '';
            const apiUrl = baseUrl.replace(/\/$/, '') + '/' + apiPath;
            const apiKey = process.env.ANEMIA_SERVICE_API_KEY;
            const options = await getRequestOptions();
            options.headers["Authorization"] = `Bearer ${apiKey}`;
            options.headers["Content-Type"] = `application/json`;
            const obj: Record<string, unknown> = {
                "path"     : cloudFrontPath,
                "FileName" : filename
            };
            if (age !== undefined) obj["age"] = age;
            if (gender !== undefined) obj["gender"] = gender;
            const response = await needle("POST", apiUrl, obj, options);

            return response;
        } catch (error) {
            console.log("error while getting result from Anemia Service");
        }

    }

    async Record(userId){
        const cacheData = await CacheMemory.get(`Anemia:${userId}`);
        const AnemiaRepoObj =
        (await this.entityManagerProvider.getEntityManager(this.EnvironmentProviderService)).getRepository(AnemiaDataRecord);
        await AnemiaRepoObj.create({
            userPlatformId     : userId,
            patientId          : cacheData["patientId"],
            pridictedHb        : cacheData["HbValue"],
            originalImagePath  : cacheData["origionalImagePath"],
            segmentedImagePath : cacheData["SegmentedImagePath"],
            age                : cacheData["age"],
            gender             : cacheData["gender"]
        });
        CacheMemory.delete(`Anemia:${userId}`);

    }

    async Regression(eventObj){
        try {
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const parameters = eventObj.body.queryResult.parameters;
            const age = String(parameters.Age ?? "");
            const gender = String(parameters.Gender ?? "");
            const cacheData = await CacheMemory.get(`Anemia:${userId}`);
            const segmentedImagePath = cacheData?.["SegmentedImagePath"];
            if (!segmentedImagePath) {
                console.log(`Regression aborted: SegmentedImagePath missing for user ${userId}`);
                return;
            }
            const filename = path.basename(segmentedImagePath);
            cacheData["age"] = age;
            cacheData["gender"] = gender;
            cacheData["patientId"] = parameters.patientId ?? "";
            CacheMemory.set(`Anemia:${userId}`, cacheData);
            const result = await this.getAnemiaResults(segmentedImagePath, filename, "predict", age, gender);
            const HbValue = result?.body?.hb_value;
            cacheData["HbValue"] = HbValue;
            CacheMemory.set(`Anemia:${userId}`, cacheData);
            await this.Record(userId);
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            if (payload.source === "Telegram") {
                payload.source = "telegram";
            }
            await this.sendExtraMessagesobj?.sendExtraMessage(eventObj, "AnemiaImageCorrect", String(HbValue));
        } catch (error) {
            console.log("Regression Service Error", error);
        }
    }

}
