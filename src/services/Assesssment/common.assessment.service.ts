/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger.js';
import { NeedleService } from '../needle.service.js';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service.js';
import type { Iresponse } from '../../refactor/interface/message.interface.js';
import { AssessmentSessionLogs } from '../../models/assessment.session.model.js';
import { EntityManagerProvider } from '../entity.manager.provider.service.js';
import { commonResponseMessageFormat } from '../common.response.format.object.js';
import type { platformServiceInterface } from '../../refactor/interface/platform.interface.js';
import { ServeAssessmentService } from '../maternalCareplan/serveAssessment/serveAssessment.service.js';
import { CacheMemory } from '../cache.memory.service.js';
import { ChatMessage } from '../../models/chat.message.model.js';
import type { QueueDoaminModel } from '../fire.and.forget.service.js';
import { FireAndForgetService } from '../fire.and.forget.service.js';
import { Registration } from '../registrationsAndEnrollements/patient.registration.service.js';
import { sendTelegramButtonService } from '../telegram.button.service.js';
import { AssessmentIdentifiers } from '../../models/assessment/assessment.identifiers.model.js';

@scoped(Lifecycle.ContainerScoped)
export class CommonAssessmentService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(Registration) private registration?: Registration,
    ){}

    async triggerAssessment (eventObj, assessmentDisplayCode) {
        try {
            let channel = eventObj.body.originalDetectIntentRequest.payload.source;
            if (channel === "Telegram"){
                channel = "telegram";
            }
            this._platformMessageService = eventObj.container.resolve(channel);
            const platformUserId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const platformUserName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const patientIDArray = await this.registration.getPatientUserId(channel,
                platformUserId, platformUserName);

            // const assessmentId = userTask.Action.Assessment.id;
            const apiURL = `clinical/assessment-templates/search?displayCode=${assessmentDisplayCode}`;
            const requestBody = await this.needleService.needleRequestForREAN("get", apiURL );

            //let assessmentSessionLogs = null;
            if (requestBody.Data.AssessmentTemplateRecords.Items.length !== 0) {
                const assessmentTemplateId = requestBody.Data.AssessmentTemplateRecords.Items[0].id;
                const assessmentTemplateTitle = requestBody.Data.AssessmentTemplateRecords.Items[0].Title;
                const body : QueueDoaminModel =  {
                    Intent : "StartAssessment",
                    Body   : {
                        EventObj                : eventObj,
                        PatientUserId           : patientIDArray.patientUserId,
                        PersonPhoneNumber       : platformUserId,
                        AssessmentTemplateId    : assessmentTemplateId,
                        Channel                 : channel,
                        AssessmentTemplateTitle : assessmentTemplateTitle
                    }
                };
                FireAndForgetService.enqueue(body);
                const message = "We are starting an assessment for you please answer few of our questions.";
                return this.getFullfillmentObj(message);

            } else {
                const message = `Sorry for the inconvenience, could not find the assessment template with code ${assessmentDisplayCode}.`;
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

    public async createAssessment(patientDetail){
        const apiURL = `clinical/assessments`;
        const obj = patientDetail;
        const assesmentData = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
        return assesmentData;
    }

    public async getAssessmentUserTasks(assessmentDetails,userTaskData){
        const userTaskApiURL = `user-tasks`;
        const userTaskBody = {
            "UserId"             : assessmentDetails.patientUserId,
            "Task"               : assessmentDetails.assessmentTemplateTitle,
            "Category"           : "Assessment",
            "ActionType"         : "Custom",
            "ActionId"           : userTaskData.Data.Assessment.id,
            "ScheduledStartTime" : assessmentDetails.ScheduledDate,
            "ScheduledEndTime"   : assessmentDetails.ScheduledDate,
            "IsRecurrent"        : false
        };
        await this.needleService.needleRequestForREAN("post", userTaskApiURL, null, userTaskBody);
    }

    public async startAssessmentAndUpdateDb (eventObj, patientUserId: string, personPhoneNumber: string, assessmentTemplateId: string,
        assessmentTemplateTitle: string, channel: string)  {

        const currentDate = new Date().toISOString()
            .split('T')[0];

        const AssessmentDetails = {
            "PatientUserId"        : patientUserId,
            "Title"                : assessmentTemplateTitle,
            "AssessmentTemplateId" : assessmentTemplateId,
            "ScheduledDate"        : currentDate
        };

        const assessmentData = await this.createAssessment(AssessmentDetails);
        await this.getAssessmentUserTasks(AssessmentDetails,assessmentData);
        let telegramPayload = null;
        if (assessmentData.Data.Assessment) {
            const assessment = JSON.stringify(assessmentData.Data.Assessment);
            const { updatedPayload, assessmentSessionLogs } = await this.serveAssessmentService.startAssessment(  personPhoneNumber,  channel, assessment);
            let messageType = "template";
            if (assessmentSessionLogs.userResponseType === 'Single Choice Selection' && (channel.toLowerCase() === 'telegram' )) {
                messageType = "inline_keyboard";
                const buttonArray = updatedPayload.buttonIds.flatMap(button => {
                    const option = button.parameters[0].payload;
                    return [option.split('_')[1],option ];
                });
                telegramPayload = await sendTelegramButtonService(buttonArray);
                channel = "telegram";

            }
            else if (assessmentSessionLogs.userResponseType !== 'Single Choice Selection' && (channel.toLowerCase() === 'telegram')){
                messageType = "text";
                channel = "telegram";
            }
            this._platformMessageService = eventObj.container.resolve(channel);

            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = channel;
            response_format.sessionId = personPhoneNumber;
            response_format.messageText = updatedPayload["messageText"];
            response_format.message_type = messageType;
            let message_to_platform = null;
            if ((channel === 'telegram' || channel === 'Telegram') &&  messageType === "inline_keyboard" ){
                message_to_platform = await this._platformMessageService.SendMediaMessage(response_format, telegramPayload);
            }
            else {
                message_to_platform = await this._platformMessageService.SendMediaMessage(response_format, updatedPayload);
            }
            assessmentSessionLogs.userMessageId = await this._platformMessageService.getMessageIdFromResponse(message_to_platform);
            const key = `${personPhoneNumber}:Assessment:${assessmentSessionLogs.assesmentId}`;
            await CacheMemory.set(key, assessmentSessionLogs.userMessageId);

            const AssessmentSession = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
            const assessmentSessionData = await AssessmentSession.create(assessmentSessionLogs);
            const assessmentIdentifierObj = {
                assessmentSessionId : assessmentSessionData.autoIncrementalID,
                identifier          : assessmentSessionLogs.identifiers,
                userResponseType    : assessmentSessionData.userResponseType
            };
            const AssessmentIdentifiersRepo = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(AssessmentIdentifiers);
            await AssessmentIdentifiersRepo.create(assessmentIdentifierObj);

            if (assessmentSessionLogs.userResponseType === "Text" ) {
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                await this.serveAssessmentService.updateMessageFlag(personPhoneNumber, assessmentSessionLogs.userMessageId, chatMessageRepository);
            }
        }
    }

}
