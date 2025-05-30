import { Lifecycle, scoped, inject } from 'tsyringe';
import { CommonAssessmentService } from './common.assessment.service';
import { AssessmentRequest } from '../../refactor/interface/assessment/assessment.interface';
import { ServeAssessmentService } from '../maternalCareplan/serveAssessment/serveAssessment.service';
import { sendTelegramButtonService } from '../telegram.button.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { CacheMemory } from '../cache.memory.service';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { AssessmentSessionLogs } from '../../models/assessment.session.model';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { ChatMessage } from '../../models/chat.message.model';

@scoped(Lifecycle.ContainerScoped)
export class AssessmentService {

    constructor(
        @inject(CommonAssessmentService) private commonAssessmentService?: CommonAssessmentService,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) 
            private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ){}

    async createAssessment(input: AssessmentRequest, platformMessageService: platformServiceInterface) {
        await this.startAssessmentAndUpdate(input, platformMessageService);
    }

    async startAssessmentAndUpdate(input: AssessmentRequest, platformMessageService: platformServiceInterface) {
        const currentDate = new Date().toISOString()
            .split('T')[0];
        let channel = input.Body.Channel;
        const AssessmentDetails = {
            "PatientUserId"        : input.Body.PatientUserId,
            "Title"                : input.Body.AssessmentTemplateTitle,
            "AssessmentTemplateId" : input.Body.AssessmentTemplateId,
            "ScheduledDate"        : currentDate
        };
        const assessmentData = await this.commonAssessmentService.createAssessment(AssessmentDetails);
        const assessmentUserTasks = 
            await this.commonAssessmentService.getAssessmentUserTasks(AssessmentDetails, assessmentData);

        let telegramPayload = null;
        if (assessmentData.Data.Assessment) {
            const assessment = JSON.stringify(assessmentData.Data.Assessment);
            const { metaPayload, assessmentSessionLogs } = 
                await this.serveAssessmentService.startAssessment(
                    input.Body.PersonPhoneNumber,
                    channel,
                    assessment
                );
            let messageType = "template";
            
            // Handling the chanel specific for telegram
            if (channel.toLocaleLowerCase() === "telegram") {
                if (assessmentSessionLogs.userResponseType === 'Single Choice Selection') {
                    messageType = "inline_keyboard";

                    const buttonArray = metaPayload.buttonIds.flatMap(button => {
                        const option = button.parameters[0].payload;
                        return [option.split('_')[1], option];
                    });
                    
                    telegramPayload = await sendTelegramButtonService(buttonArray);
                } else {
                    messageType = "text";
                }
                channel = "telegram";
            }

            const responseFormat: Iresponse = commonResponseMessageFormat();
            responseFormat.platform = channel;
            responseFormat.sessionId = input.Body.PersonPhoneNumber;
            responseFormat.messageText = metaPayload["messageText"];
            responseFormat.message_type = messageType;
            let messageToPlatform = null;
            
            if ((channel === 'telegram' || channel === 'Telegram') &&  messageType === "inline_keyboard" ){
                messageToPlatform = await platformMessageService.SendMediaMessage(responseFormat, telegramPayload);
            }
            else {
                messageToPlatform = await platformMessageService.SendMediaMessage(responseFormat, metaPayload);
            }
            assessmentSessionLogs.userMessageId = 
                await platformMessageService.getMessageIdFromResponse(messageToPlatform);
            const key = `${input.Body.PersonPhoneNumber}:Assessment`;
            await CacheMemory.set(key, assessmentSessionLogs.userMessageId);

            const AssessmentSession = 
                (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService))
                    .getRepository(AssessmentSessionLogs);
            await AssessmentSession.create(assessmentSessionLogs);

            if (assessmentSessionLogs.userResponseType === "Text" ) {
                const chatMessageRepository = 
                    (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService))
                        .getRepository(ChatMessage);
                await this.serveAssessmentService.updateMessageFlag(
                    input.Body.PersonPhoneNumber,
                    assessmentSessionLogs.userMessageId,
                    chatMessageRepository
                );
            }
        }

    }

}