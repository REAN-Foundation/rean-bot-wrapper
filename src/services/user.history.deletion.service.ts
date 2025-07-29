import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import path from 'path';
import needle from 'needle';
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ChatMessage } from '../models/chat.message.model';
import { ChatSession } from '../models/chat.session';
import { ContactList } from '../models/contact.list';
import { UserConsent } from '../models/user.consent.model';
import { UserInfo } from '../models/user.info.model';
import { AssessmentSessionLogs } from '../models/assessment.session.model';
import WorkflowUserDa from '../models/workflow.user.data.model';
import { NeedleService } from "./needle.service";

@scoped(Lifecycle.ContainerScoped)
export class userHistoryDeletionService {

    private retryNumber = 0;

    constructor(
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}
    async deleteUserProfile(userId){
            try {
                //const parameters = eventObj.body.queryResult.parameters;
                const user = userId;

                const contactList = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(ContactList);

                const chatSession = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(ChatSession);

                const chatMessage = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(ChatMessage);

                const userConsent = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(UserConsent);

                const userInfo = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(UserInfo);

                const assessmentSessionLogs = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(AssessmentSessionLogs);

                const workflowUserData = (
                    await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
                ).getRepository(WorkflowUserData);

                const personContactList = await contactList.findAll({ where: { mobileNumber: user } });
                const personChatMessage = await contactList.findAll({ where: { userPlatformId: user } });

                await contactList.destroy({
                    where: { mobileNumber: user }
                });
                await chatMessage.destroy({
                    where: { userPlatformId: user }
                });
                await chatSession.destroy({
                    where: { userPlatformId: user }
                });
                await userConsent.destroy({
                    where: { userPlatformId: user }
                });
                await userInfo.destroy({
                    where: { userPlatformId: user }
                });
                 await assessmentSessionLogs.destroy({
                    where: { userPlatformId: user }
                });
                await workflowUserData.destroy({
                    where: { UserPlatformId: user }
                });


            } catch (error) {
                console.log(error);
            }
    }
    
    async deleteReanCareData(user){
        
    }
    
}
