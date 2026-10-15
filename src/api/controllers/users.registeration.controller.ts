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
import { UserInfoService } from '../../services/user.info/user.info.service';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';
import { userHistoryDeletionService } from '../../services/user.history.deletion.service';
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
                null,
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

    // Same x-api-key check as the 'api' channel webhook (WEBHOOK_MOCK_CHANNEL_CLIENT_API_KEY)
    private async isAuthenticated(request, response): Promise<boolean> {
        const authenticator: clientAuthenticator = request.container.resolve('api.authenticator');
        try {
            await authenticator.authenticate(request, response);
            return true;
        } catch (authError) {
            this.responseHandler.sendFailureResponse(response, 401, authError.message, request);
            return false;
        }
    }

    registerUser = async (request, response) => {
        try {
            if (!(await this.isAuthenticated(request, response))) {
                return;
            }

            const { model: userDetails, errors } = this._validator.validateUserRegistrationDetails(request);
            if (errors.length > 0) {
                this.responseHandler.sendFailureResponse(response, 400, 'Invalid request', request, null, errors);
                return;
            }
            const registrationService: Registration = request.container.resolve(Registration);
            const userInfoService: UserInfoService = request.container.resolve(UserInfoService);
            const entityManagerProvider = request.container.resolve(EntityManagerProvider);

            // x-api-key is the wrapper's key here, so ReanCare is called with the default REANCARE_API_KEY
            const result = await registrationService.getPatientUserId(
                userDetails.platform,
                userDetails.platformUserId,
                userDetails.userName
            );
            if (result.statusCode !== 200 || !result.patientUserId) {
                this.responseHandler.sendFailureResponse(response, result.statusCode || 500,
                    `Registration failed: ${result.errorMessage ?? 'patient user id not received from ReanCare'}`, request);
                return;
            }

            // Adds the contact list entry (and chat session for new users) or updates the patient user id
            await registrationService.wrapperRegistration(
                entityManagerProvider,
                userDetails.platformUserId,
                userDetails.userName,
                userDetails.platform,
                result.patientUserId
            );

            const userInfoProvided = userDetails.age !== undefined || userDetails.gender !== undefined;
            if (userInfoProvided) {
                await userInfoService.updateUserInfo(userDetails.platformUserId, {
                    Name   : userDetails.userName,
                    Age    : userDetails.age,
                    Gender : userDetails.gender
                });
            }

            this.responseHandler.sendSuccessResponseForApp(response, 200, 'Registration Successful', {
                platformUserId : userDetails.platformUserId,
                patientUserId  : result.patientUserId,
                userInfoSaved  : userInfoProvided
            });
        }
        catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
    };

    // Same deletion as the 'deleteHistory - custom' intent: removes the user's patient record on ReanCare
    deleteUserHistory = async (request, response) => {
        try {
            if (!(await this.isAuthenticated(request, response))) {
                return;
            }

            const platformUserId = request.params.platformUserId?.trim();
            if (!platformUserId) {
                this.responseHandler.sendFailureResponse(response, 400, "'platformUserId' is required", request);
                return;
            }

            const deletionService: userHistoryDeletionService = request.container.resolve(userHistoryDeletionService);
            const result = await deletionService.deleteUserFromAllServices(platformUserId);

            switch (result.status) {
            case 'deleted':
                this.responseHandler.sendSuccessResponseForApp(response, 200, 'User History Deleted Successfully', {
                    platformUserId,
                    patientUserId : result.patientUserId
                });
                return;
            case 'contact_not_found':
                this.responseHandler.sendFailureResponse(response, 404, `No user found for platformUserId: ${platformUserId}`, request);
                return;
            case 'patient_not_found':
                this.responseHandler.sendFailureResponse(response, 404, `No patient user id linked to platformUserId: ${platformUserId}`, request);
                return;
            default:
                this.responseHandler.sendFailureResponse(response, 502, `Deletion failed on ReanCare: ${result.message ?? 'unknown error'}`, request);
            }
        }
        catch (error) {
            this.errorHandler.handleControllerError(error, response, request);
        }
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
            await this.sendWelcomeMessage(request,response);

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
            const WelcomeMessageTemplateNameJson = await clientEnvironmentProviderService.getClientEnvironmentVariable("WELCOME_MESSAGE_TEMPLATE_NAMES");
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
