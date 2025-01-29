/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ErrorHandler } from '../../utils/error.handler';
import { UserDetailsValidator } from '../validator/user.registration.validator';
import { UserDetailsDomainModel } from '../../domain.types/userAction/user.enrollment.domain.models';
import { CareplanEnrollmentDomainModel } from '../../domain.types/userAction/user.enrollment.domain.models';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../../services/common.response.format.object';
import { Registration } from '../../services/registrationsAndEnrollements/patient.registration.service';
import { careplanEnrollment } from '../../services/registrationsAndEnrollements/careplan.enrollement.service';
@scoped(Lifecycle.ContainerScoped)
export class UserRegistrationController{

    private _validator = new UserDetailsValidator();

    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(Registration) private registrationService?: Registration,
        @inject(careplanEnrollment) private careplanEnrollmentService?: careplanEnrollment,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService

    ) {

    }

    register = async (request, response) => {
        try
        {
            const userDetails: UserDetailsDomainModel = await this._validator.validateUserDetails(request);
            const authenticationKey = request.headers['x-api-key'];
            const entityManagerProvider = request.container.resolve(EntityManagerProvider);
            const result = await this.registrationService.getPatientUserId(
                userDetails.platform,
                userDetails.phoneNumber,
                userDetails.userName,
                authenticationKey
            );
            if (result.statusCode === 200) {
                await this.registrationService.wrapperRegistration(
                    entityManagerProvider,
                    userDetails.phoneNumber,
                    userDetails.userName,
                    userDetails.platform,
                    result.patientUserId
                );
                await this.sendWelcomeMessage(request, response);

                // Success response
                this.responseHandler.sendSuccessResponse(response, 200, 'Onboarding Successful', "");
            } else {
                this.responseHandler.sendSuccessResponse(response, result.statusCode,`Onboarding failed: ${result.errorMessage}`,""
                );
            }
        }
        catch (error){ this.errorHandler.handleControllerError(error, response, request); }
    };

    enrollToCareplan = async(request, response)=>{
        try {
            this.registrationService = request.container.resolve(Registration);
            this.careplanEnrollmentService = request.container.resolve(careplanEnrollment);
            const entityManagerProvider = request.container.resolve(EntityManagerProvider);
            const userDetails: UserDetailsDomainModel = await this._validator.validateUserDetails(request);
            const authenticationKey = request.headers['x-api-key'];
            const result = await this.registrationService.getPatientUserId(
                userDetails.platform,
                userDetails.phoneNumber,
                userDetails.userName,
                null,
                authenticationKey
            );
            await this.registrationService.wrapperRegistration(
                entityManagerProvider,
                userDetails.phoneNumber,
                userDetails.userName,
                userDetails.platform,
                result.patientUserId
            );
            const enrollmentDetails : CareplanEnrollmentDomainModel = await this._validator.validateCareplanEnrollmentDetails(request);
            const dayOffSet = await this.calculateOffset(enrollmentDetails.lmpstr);
            await this.careplanEnrollmentService.carePlanEnrollment(
                result.patientUserId,
                authenticationKey,
                dayOffSet,
                request.params.careplanId,
                request.params.client,
                enrollmentDetails.platform
            );
            
            // await this.sendWelcomeMessage(request,response);
            this.responseHandler.sendSuccessResponse(response, 200, 'User successfully enrolled in the maternal care plan', "");
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    async calculateOffset(lmpDateStr: string){
        try {
            const lmpDate = new Date(lmpDateStr); // Directly parse the date string
            if (isNaN(lmpDate.getTime())) {
                throw new Error("Invalid date format");
            }
            const todayDate = new Date();
            const timeDiff = todayDate.getTime() - lmpDate.getTime(); // Difference in milliseconds
            const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) - 35;
            return totalDays;
        } catch (error) {
            console.error("Error in calculateOffset:", error);
            return undefined;
        }
    }
    

    unenrollFromCareplan = async(request, response)=>{
        try {
            this.registrationService = request.container.resolve(Registration);
            this.careplanEnrollmentService = request.container.resolve(careplanEnrollment);
            const userDetails: UserDetailsDomainModel = await this._validator.validateUserDetails(request);
            const authenticationKey = request.headers['x-api-key'];
            const result = await this.registrationService.getPatientUserId(
                userDetails.platform,
                userDetails.phoneNumber,
                userDetails.userName,null,
                authenticationKey
            );

            await this.careplanEnrollmentService.careplanUnEnrollement(result.patientUserId,authenticationKey);
            this.responseHandler.sendSuccessResponse(response, 200, 'Unenrolled Successfully', "");

        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    async sendWelcomeMessage(request,response){
        try {
            const userDetails :  UserDetailsDomainModel = await this._validator.validateUserDetails(request);
            const clientEnvironmentProviderService = request.container.resolve(ClientEnvironmentProviderService);
            const WelcomeMessageTemplateNameJson = clientEnvironmentProviderService.getClientEnvironmentVariable("WELCOME_MESSAGE_TEMPLATE_NAMES");
            const payload: Record<string, any> = {
                variables          : [],
                templateName       : JSON.parse(WelcomeMessageTemplateNameJson)[userDetails.languageCode],
                languageForSession : userDetails.languageCode,
            };
            this._platformMessageService = request.container.resolve(userDetails.platform);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = userDetails.platform;
            response_format.sessionId = userDetails.phoneNumber;
            response_format.messageText = JSON.parse(WelcomeMessageTemplateNameJson)[userDetails.languageCode];
            response_format.message_type = "template";
            await this._platformMessageService.SendMediaMessage(response_format, payload);
        } catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    }

}
