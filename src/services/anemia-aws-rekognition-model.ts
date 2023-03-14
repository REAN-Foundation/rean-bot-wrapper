import { AwsS3manager } from './aws.file.upload.service';
import AWS from 'aws-sdk';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { URL } from 'url';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class RekognitionService {

    constructor(private awsS3manager?: AwsS3manager,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {
    }

    detectAnemia = async(imagePathFromDF) => {
        const crossAccountCredentials: any = await this.awsS3manager.getCrossAccountCredentials();
        const rekognition = new AWS.Rekognition({ region: 'us-west-2' });
        const bucketName = process.env.BUCKET_NAME;
        const projectVersionArn = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ANEMIA_PROJECT_VERSION_ARN");
        const imageName = new URL(imagePathFromDF).pathname.split('/')[2];
        const key = "dev/" + imageName;
        const params = {
            Image : {
                S3Object : {
                    Bucket : bucketName,
                    Name   : key
                }
            },
            MinConfidence     : 80,
            ProjectVersionArn : projectVersionArn
        };
        return new Promise<string>((resolve, reject) => {
            rekognition.detectCustomLabels(params, (err, data) => {
                if (err) {
                    console.log(err, err.stack);
                    reject(err);
                } else {
                    console.log(data);
                    resolve("You are: " + data.CustomLabels[0].Name);
                }
            });
        });
    }



}