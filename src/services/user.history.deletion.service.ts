import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ContactList } from '../models/contact.list';
import { GetHeaders } from '../services/biometrics/get.headers';
import { NeedleService } from "./needle.service";

@scoped(Lifecycle.ContainerScoped)
export class userHistoryDeletionService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(GetHeaders) private getHeaders?: GetHeaders
    ){}

    async deleteUserFromAllServices(userPlatformId) {
        try {
            const entityManager = await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService);
            const contactListRepo = entityManager.getRepository(ContactList);
            const contact = await contactListRepo.findOne({
                where: { mobileNumber: userPlatformId }
            });
            
            if (!contact) {
                console.log(`No ContactList entry found for userPlatformId: ${userPlatformId}`);
                return;
            }
            const patientUserId = contact.patientUserId;

            if (!patientUserId) {
                console.log(`No patientUserId found for userPlatformId: ${userPlatformId}`);
                return;
            }
            const deletion_endpoint = `api/v1/patients/${patientUserId}`;
            const deleteResponse = await this.needleService.needleRequestForREAN("delete", deletion_endpoint, null, null);
            console.log(`Deletion response for patientUserId ${userPlatformId}:`, deleteResponse);

        } catch (error) {
            console.log(error);
        }
    }

}
