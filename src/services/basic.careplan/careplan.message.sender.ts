import { Logger } from "../../common/logger";
import { ContainerService } from "../container/container.service";
import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
import { TenantSettingService } from "../tenant.setting/tenant.setting.service";
import { IntentRepo } from "../../database/repositories/intent/intent.repo";
import { CareplanMetaDataValidator } from "./careplan.metadata.validator";
import { PlatformMessageService } from "./platform.message.service";
import { platformServiceInterface } from "../../refactor/interface/platform.interface";
import { CareplanIntentMetadata } from "../../domain.types/basic.careplan/careplan.types";

///////////////////////////////////////////////////////////////////////////////
export class CareplanMessageSender {

    public static sendEnrollmentMessage = async (
        clientName: string,
        channel: string,
        patientUserId?: string
    ): Promise<void> => {
        try {
            CareplanMessageSender.validateInputs(clientName, patientUserId);

            const childContainer = CareplanMessageSender.createContainer(clientName);
            const { apiKey, baseUrl } = CareplanMessageSender.getClientConfig(childContainer);

            await CareplanMessageSender.ensureFeatureEnabled(clientName, apiKey, baseUrl);

            const metadata = await CareplanMessageSender.getValidatedMetadata(childContainer, channel);

            await CareplanMessageSender.sendMessage(childContainer, channel, patientUserId, metadata);

            Logger.instance().log(
                `Successfully sent careplan enrollment message to patient: ${patientUserId}`
            );

        } catch (error) {
            Logger.instance().log(`Error sending careplan enrollment message: ${error.message}`);
        }
    };

    private static validateInputs(clientName: string, patientUserId?: string): void {
        if (!clientName || !patientUserId) {
            throw new Error("Client name and patient user ID are required for careplan enrollment message");
        }
    }

    private static createContainer(clientName: string) {
        const childContainer = ContainerService.createChildContainer(clientName);
        if (!childContainer) {
            throw new Error("Failed to create dependency container");
        }
        return childContainer;
    }

    private static getClientConfig(childContainer: any): { apiKey: string; baseUrl: string } {
        const clientEnvironmentProviderService = childContainer.resolve(ClientEnvironmentProviderService);
        return {
            apiKey  : clientEnvironmentProviderService.getClientEnvironmentVariable("REANCARE_API_KEY"),
            baseUrl : clientEnvironmentProviderService.getClientEnvironmentVariable("REAN_APP_BACKEND_BASE_URL")
        };
    }

    private static async ensureFeatureEnabled(
        clientName: string,
        apiKey: string,
        baseUrl: string
    ): Promise<void> {
        const isEnabled = await TenantSettingService.isBasicCareplanEnabled(clientName, apiKey, baseUrl);
        if (!isEnabled) {
            throw new Error("Basic Careplan feature is not enabled for this tenant");
        }
    }

    private static async getValidatedMetadata(childContainer: any, channel: string): Promise<CareplanIntentMetadata> {
        const searchCode = `BasicCareplan_${channel}`;
        Logger.instance().log(
            `Searching for basic careplan intent with code: ${searchCode}`
        );
        const basicCareplanIntent = await IntentRepo.findIntentByCode(childContainer, searchCode);
        if (!basicCareplanIntent) {
            throw new Error('Basic careplan intent not found in database for channel: ' + channel);
        }

        Logger.instance().log(
            `Found basic careplan intent: ${JSON.stringify(JSON.parse(basicCareplanIntent.Metadata))}`
        );

        const metadata = JSON.parse(basicCareplanIntent.Metadata);
        return CareplanMetaDataValidator.validate(metadata);
    }

    private static async sendMessage(
        childContainer: any,
        channel: string,
        patientUserId: string,
        metadata: any
    ): Promise<void> {
        const platformService = childContainer.resolve(channel) as platformServiceInterface;

        const platformMessage = PlatformMessageService.buildPlatformMessage(
            patientUserId,
            channel,
            metadata
        );

        await platformService.sendManualMesage(platformMessage);
    }

}
