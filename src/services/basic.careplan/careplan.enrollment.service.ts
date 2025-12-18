import { DependencyContainer } from "tsyringe";
import { Logger } from "../../common/logger";
import { ContainerService } from "../container/container.service";
import { ContactListRepo } from "../../database/repositories/contact.list/contact.list.repo";
import { ContactListDto } from "../../domain.types/contact.list/contact.list.domain.model";
import { CareplanEnrollmentDomainModel } from "../../domain.types/basic.careplan/careplan.types";
import { ReancareCareplanService } from "./reancare.careplan.service";
import { Imessage, Iresponse } from "../../refactor/interface/message.interface";
import { SystemGeneratedMessagesRepo } from "../../database/repositories/system.messages/system.generated.messages.repo";
import { platformServiceInterface } from "../../refactor/interface/platform.interface";
import { commonResponseMessageFormat } from "../common.response.format.object";

///////////////////////////////////////////////////////////////////////////////
export class CareplanEnrollmentService {

    public static enrollPatient = async (
        clientName: string,
        channel: string,
        messageBody: Imessage,
        enrollmentModel: CareplanEnrollmentDomainModel
    ) => {
        try {
            Logger.instance().log(
                `Enrolling patient to careplan: ${JSON.stringify({
                    clientName,
                    channel,
                    platformId : messageBody.platformId,
                    planCode   : enrollmentModel.PlanCode
                })}`
            );

            const childContainer = CareplanEnrollmentService.createContainer(clientName);

            const user = await CareplanEnrollmentService.getPatientUser(
                childContainer,
                messageBody.platformId
            );

            const response = await CareplanEnrollmentService.executeEnrollment(
                childContainer,
                user.patientUserId,
                enrollmentModel
            );

            await CareplanEnrollmentService.sendRegistrationMessage(
                childContainer,
                messageBody.platformId,
                channel
            );

            Logger.instance().log(
                `Successfully enrolled patient ${user.patientUserId} to careplan ${enrollmentModel.PlanCode}`
            );

            return response;

        } catch (error) {
            Logger.instance().log(`Error enrolling patient to careplan: ${error.message}`);
            throw error;
        }
    };

    public static checkEnrollmentEligibility = async (
        message: Imessage,
        channel: string
    ): Promise<boolean> => {
        try {
            if (!message || !channel) {
                throw new Error("Message and channel are required for eligibility check");
            }

            Logger.instance().log(
                `Checking careplan enrollment eligibility for platformId: ${message.platformId}`
            );

            return true;

        } catch (error) {
            Logger.instance().log(`Error checking careplan enrollment eligibility: ${error.message}`);
            return false;
        }
    };

    private static sendRegistrationMessage = async (
        childContainer: DependencyContainer,
        platformId: string,
        channel: string
    ) => {
        try {
            Logger.instance().log(
                `Sending registration message to patient: ${platformId} via channel: ${channel}`
            );

            const platformMessageService: platformServiceInterface = childContainer.resolve(channel);

            const registrationMessage = await SystemGeneratedMessagesRepo.findMessageByName(
                childContainer,
                'CAREPLAN_REG_MESSAGE'
            );

            const welcomeMessage = await SystemGeneratedMessagesRepo.findMessageByName(
                childContainer,
                "CAREPLAN_WELCOME_MESSAGE"
            );
            
            if (!registrationMessage && !welcomeMessage) {
                Logger.instance().log('Careplan registration & welcome message not found in system messages');
                return;
            }

            const responseFormat: Iresponse = commonResponseMessageFormat();
            responseFormat.platform = channel;
            responseFormat.sessionId = platformId;
            responseFormat.message_type = "text";
            if (registrationMessage) {
                responseFormat.messageText = registrationMessage.MessageContent;
                await platformMessageService.SendMediaMessage(responseFormat, null);
            }

            if (welcomeMessage) {
                responseFormat.messageText = welcomeMessage.MessageContent ;
                await platformMessageService.SendMediaMessage(responseFormat, null);
            }

            Logger.instance().log(
                `Successfully sent registration message to patient: ${platformId}`
            );
        } catch (error) {
            Logger.instance().log(`Error sending registration message: ${error.message}`);
            throw error;
        }
    };
    
    private static createContainer(clientName: string): DependencyContainer {
        const childContainer = ContainerService.createChildContainer(clientName);
        if (!childContainer) {
            throw new Error("Failed to create dependency container for enrollment");
        }
        return childContainer;
    }

    private static async getPatientUser(
        childContainer: DependencyContainer,
        platformId: string
    ): Promise<ContactListDto> {
        const user = await ContactListRepo.findContactByMobileNumber(childContainer, platformId);

        if (!user) {
            throw new Error(`Patient not found for platformId: ${platformId}`);
        }

        if (!user.patientUserId) {
            throw new Error(`Patient user ID not available for platformId: ${platformId}`);
        }

        return user;
    }

    private static async executeEnrollment(
        childContainer: DependencyContainer,
        patientUserId: string,
        enrollmentModel: CareplanEnrollmentDomainModel
    ) {
        const reancareCareplanService = childContainer.resolve(ReancareCareplanService);

        Logger.instance().log(
            `Executing enrollment for patient: ${patientUserId}, plan: ${enrollmentModel.PlanCode}`
        );

        return await reancareCareplanService.EnrollCareplan(
            childContainer,
            patientUserId,
            enrollmentModel
        );
    }

}
