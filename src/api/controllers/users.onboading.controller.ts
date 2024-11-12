/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ErrorHandler } from '../../utils/error.handler';
import { UserDetailsValidator } from '../validator/user.onboading.validator';
import { UserDetailsDomainModel } from '../../domain.types/userAction/user.onboading.domain.model';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../../services/common.response.format.object';
import { Registration } from '../../services/registration/patient.registration.service';
@scoped(Lifecycle.ContainerScoped)
export class UserOnboadingController{

    private _validator = new UserDetailsValidator()

    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(Registration) private registrationService?: Registration,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService

    ) {

    }

    onboadingProcess= async(request, response)=>{
        try {
            {
                const userDetails :  UserDetailsDomainModel = await this._validator.getDomainModel(request);
                const entityManagerProvider = request.container.resolve(EntityManagerProvider);
                const patientUserId = await this.registrationService.getPatientUserId(request.params.channel, userDetails.phoneNumber, userDetails.userName);
                this.registrationService.wrapperRegistration(entityManagerProvider,userDetails.phoneNumber,userDetails.userName,request.params.channel,patientUserId);
                this.sendWelcomeMessage(request,response);
                this.responseHandler.sendSuccessResponse(response, 200, 'Onboarding Successfull', "");
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, response, request);
        }
    };

    async sendWelcomeMessage(request,response){
        try {
            const userDetails :  UserDetailsDomainModel = await this._validator.getDomainModel(request);
            const clientEnvironmentProviderService = request.container.resolve(ClientEnvironmentProviderService);
            const WelcomeMessageTemplateNameJson = clientEnvironmentProviderService.getClientEnvironmentVariable("WELCOME_MESSAGE_TEMPLATE_NAMES");
            const payload: Record<string, any> = {
                variables          : [],
                templateName       : "welcome_message",
                languageForSession : userDetails.languageCode,
            };
            this._platformMessageService = request.container.resolve(request.params.channel);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = request.params.channel;
            response_format.sessionId = userDetails.phoneNumber;
            response_format.messageText = WelcomeMessageTemplateNameJson[userDetails.languageCode];
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, payload);
        } catch (error) {
            this.errorHandler.handle_controller_error(error, response, request);
        }
    }

}
