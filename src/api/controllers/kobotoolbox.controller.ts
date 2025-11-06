import { ResponseHandler } from '../../utils/response.handler.js';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service.js';
import { AwsS3manager } from '../../services/aws.file.upload.service.js';
import { commonResponseMessageFormat } from '../../services/common.response.format.object.js';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service.js';
import { Registration } from '../../services/registrationsAndEnrollements/patient.registration.service.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import type { Iresponse } from '../../refactor/interface/message.interface.js';

// @autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class kobotoolboxController{

    private _platformMessageService?: platformServiceInterface;
    
    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(AwsS3manager) private awss3manager?: AwsS3manager,
        @inject(Registration) private registrationService?: Registration
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

    async getUserDetails(body){
        const userDetails = {
            "phoneNumber"  : body["meta_data/bot_registration_phonenumber"],
            "userName"     : body["meta_data/bot_registration_username"],
            "platform"     : body["meta_data/platform"],
            "registration" : body["meta_data/registeration_condition"]
        };
        return userDetails;
    }

    async registerUser(req,UD){
        const entityManagerProvider = req.container.resolve(EntityManagerProvider);
        this.registrationService = req.container.resolve(Registration);
        const result = await this.registrationService.getPatientUserId(UD.platform,UD.phoneNumber,UD.userName);
        await this.registrationService.wrapperRegistration(entityManagerProvider,UD.phoneNumber,UD.userName,UD.platform, result.patientUserId);
    }

    async sendFirstWelcomeMessage(request,UD){
        try {
            const clientEnvironmentProviderService = request.container.resolve(ClientEnvironmentProviderService);
            const WelcomeMessageTemplateNameJson = clientEnvironmentProviderService.getClientEnvironmentVariable("WELCOME_MESSAGE_TEMPLATE_NAMES");
            const payload: Record<string, any> = {
                variables          : [],
                templateName       : JSON.parse(WelcomeMessageTemplateNameJson)["en"],
                languageForSession : "en",
            };
            this._platformMessageService = request.container.resolve(UD.platform);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = UD.platform;
            response_format.sessionId = UD.phoneNumber;
            response_format.messageText = JSON.parse(WelcomeMessageTemplateNameJson)[UD.languageCode];
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, payload);
        } catch (error) {
            console.log("error while sending first welcome message",error);
        }
    }

    kobotoolbox = async(req, res)=>{
        try {
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            this.awss3manager = req.container.resolve(AwsS3manager);
            const filename = clientEnvironmentProviderService.getClientEnvironmentVariable("S3_KOBO_FILENAME");
            const userDetails = await this.getUserDetails(req.body);
            const registrationRequired = await clientEnvironmentProviderService.getClientEnvironmentVariable("KOBO_REGISTERATION");
            if (registrationRequired && userDetails.registration === "true") {
                this.registerUser(req,userDetails);
                this.sendFirstWelcomeMessage(req,userDetails);
            }
            const [datastructureFileKey,dataFileKey] = await this.getKeys(req,filename);
            const datastructure = await this.getdatastructure(datastructureFileKey);
            await this.awss3manager.uploadKoboData(dataFileKey,req.body, datastructure);
            this.responseHandler.sendSuccessResponse(res, 200, 'Message is sent successfully!', "");
        } catch (error) {
            console.log(error);
        }

    };
    
}
