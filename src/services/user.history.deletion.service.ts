import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ContactList } from '../models/contact.list';
import { NeedleService } from "./needle.service";

export interface UserDeletionResult {
    status         : 'deleted' | 'contact_not_found' | 'patient_not_found' | 'failed',
    patientUserId? : string,
    message?       : string
}

@scoped(Lifecycle.ContainerScoped)
export class userHistoryDeletionService {

    constructor(
        @inject(NeedleService) private needleService: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService: ClientEnvironmentProviderService,
    ){}

    async deleteUserFromAllServices(userPlatformId): Promise<UserDeletionResult> {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const contactListRepo = entityManager.getRepository(ContactList);
            const contact = await contactListRepo.findOne({
                where: { mobileNumber: userPlatformId }
            });

            if (!contact) {
                console.log(`No ContactList entry found for userPlatformId: ${userPlatformId}`);
                return { status: 'contact_not_found' };
            }
            const patientUserId = contact.patientUserId;

            if (!patientUserId) {
                console.log(`No patientUserId found for userPlatformId: ${userPlatformId}`);
                return { status: 'patient_not_found' };
            }
            const deletion_endpoint = `patients/${patientUserId}`;
            const deleteResponse = await this.needleService.needleRequestForREAN("delete", deletion_endpoint, null, null);
            console.log('Deletion response for userPlatformId %s (patientUserId %s):', userPlatformId, patientUserId, deleteResponse);

            if (deleteResponse?.HttpCode === 200) {
                return { status: 'deleted', patientUserId };
            }
            return {
                status        : 'failed',
                patientUserId : patientUserId,
                message      : deleteResponse?.Message ?? 'No valid response from ReanCare'
            };

        } catch (error) {
            console.log(error);
            return { status: 'failed', message: error?.message };
        }
    }

}
