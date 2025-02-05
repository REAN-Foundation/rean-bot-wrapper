/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { AssessmentSessionLogs } from '../../models/assessment.session.model';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { ServeAssessmentService } from '../maternalCareplan/serveAssessment/serveAssessment.service';
import { CacheMemory } from '../cache.memory.service';
import { ChatMessage } from '../../models/chat.message.model';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { Registration } from '../registrationsAndEnrollements/patient.registration.service';

@scoped(Lifecycle.ContainerScoped)
export class NoBabyMovementAssessmentService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(Registration) private registration?: Registration,
    ){}
    
    async createAssessment (eventObj, assessmentCode) {
        try {
            const channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const result = await this.registration.getPatientUserId(channel,
                personPhoneNumber, personName);

            // const assessmentId = userTask.Action.Assessment.id;
            const apiURL = `clinical/assessment-templates/search?displayCode=${assessmentCode}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL );

            //let assessmentSessionLogs = null;
            if (requestBody.Data.AssessmentTemplateRecords.Items.length !== 0) {
                const assessmentTemplateId = requestBody.Data.AssessmentTemplateRecords.Items[0].id;
                const assessmentTemplateTitle = requestBody.Data.AssessmentTemplateRecords.Items[0].Title;
                const body : QueueDoaminModel =  {
                    Intent : "StartAssessment",
                    Body   : {
                        EventObj                : eventObj,
                        PatientUserId           : result.patientUserId,
                        PersonPhoneNumber       : personPhoneNumber,
                        AssessmentTemplateId    : assessmentTemplateId,
                        Channel                 : channel,
                        AssessmentTemplateTitle : assessmentTemplateTitle
                    }
                };
                FireAndForgetService.enqueue(body);
                const message = "We are starting an assessment for you please answer few of our questions.";
                return this.getFullfillmentObj(message);

            } else {
                const message = `Sorry for the inconvenience, could not find the assessment template with code ${assessmentCode}.`;
                return this.getFullfillmentObj(message);
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        
        }

    }

    public getFullfillmentObj (message: string) {
        const object = {
            "fulfillmentMessages" : [
                {
                    "text" : { "text": [message] }
                }
            ]
        };
        return object;
    }

    public async startAssessmentAndUpdateDb (eventObj, patientUserId: string, personPhoneNumber: string, assessmentTemplateId: string,
        assessmentTemplateTitle: string, channel: string)  {

        const currentDate = new Date().toISOString()
            .split('T')[0];

        // Create assessment for the patient.
        const apiURL = `clinical/assessments`;
        const obj = {
            "PatientUserId"        : patientUserId,
            "Title"                : assessmentTemplateTitle,
            "AssessmentTemplateId" : assessmentTemplateId,
            "ScheduledDate"        : currentDate
        };
        const requestBody1 = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);

        // Create user task for the patient.
        const userTaskApiURL = `user-tasks`;
        const userTaskBody = {
            "UserId"             : patientUserId,
            "Task"               : assessmentTemplateTitle,
            "Category"           : "Assessment",
            "ActionType"         : "Custom",
            "ActionId"           : requestBody1.Data.Assessment.id,
            "ScheduledStartTime" : currentDate,
            "ScheduledEndTime"   : currentDate,
            "IsRecurrent"        : false
        };
        await this.needleService.needleRequestForREAN("post", userTaskApiURL, null, userTaskBody);

        if (requestBody1.Data.Assessment) {
            const msg = { userId: personPhoneNumber, channel: channel };
            const assessment = JSON.stringify(requestBody1.Data.Assessment);
            const { metaPayload, assessmentSessionLogs } = await this.serveAssessmentService.startAssessment( msg, assessment);

            const payload = eventObj.body.originalDetectIntentRequest.payload;
            channel = payload.source;
            let messageType = "template";
            if (channel === "telegram" || channel === "Telegram") {
                messageType = "text";
                channel = "telegram";
            }

            this._platformMessageService = eventObj.container.resolve(channel);
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = payload.source;
            response_format.sessionId = personPhoneNumber;
            response_format.messageText = metaPayload["messageText"];
            response_format.message_type = messageType;
            const message_to_platform = await this._platformMessageService.SendMediaMessage(response_format, metaPayload);

            assessmentSessionLogs.userMessageId = await this._platformMessageService.getMessageIdFromResponse(message_to_platform);
            const key = `${personPhoneNumber}:Assessment`;
            await CacheMemory.set(key, assessmentSessionLogs.userMessageId);

            const AssessmentSession = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
            await AssessmentSession.create(assessmentSessionLogs);

            if (assessmentSessionLogs.userResponseType === "Text" ) {
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                await this.serveAssessmentService.updateMessageFlag(personPhoneNumber, assessmentSessionLogs.userMessageId, chatMessageRepository);
            }
        }
    }
}
