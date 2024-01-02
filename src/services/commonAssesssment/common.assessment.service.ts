/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { sendApiButtonService, templateButtonService } from '../whatsappmeta.button.service';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { Iresponse } from '../../refactor/interface/message.interface';
import { AssessmentSessionLogs } from '../../models/assessment.session.model';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { AppointmentReminderService } from '../reminder/appointment.reminder.service';
import { ServeAssessmentService } from '../maternalCareplan/serveAssessment/serveAssessment.service';
import { CacheMemory } from '../cache.memory.service';

@scoped(Lifecycle.ContainerScoped)
export class NoBabyMovementAssessmentService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(AppointmentReminderService) private appointmentReminderService?: AppointmentReminderService,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    ){}
    
    async createAssessment (eventObj, assessmentCode) {
        try {
            let channel = eventObj.body.originalDetectIntentRequest.payload.source;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const patientUserId = await this.appointmentReminderService.getPatientUserId(channel, personPhoneNumber, personName);

            // const assessmentId = userTask.Action.Assessment.id;
            const apiURL = `clinical/assessment-templates/search?displayCode=${assessmentCode}`;
            let requestBody = await this.needleService.needleRequestForREAN("get", apiURL );

            //let assessmentSessionLogs = null;
            if (requestBody.Data.AssessmentTemplateRecords.Items.length !== 0) {
                const assessmentTemplate = requestBody.Data.AssessmentTemplateRecords.Items[0];
                const apiURL = `clinical/assessments`;
                const obj = {
                    "PatientUserId"        : patientUserId,
                    "Title"                : "A new assessment",
                    "AssessmentTemplateId" : assessmentTemplate.id,
                    "ScheduledDate"        : new Date().toISOString()
                        .split('T')[0]
                };
                requestBody = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
                if (requestBody.Data.Assessment) {
                    const msg = { userId: personPhoneNumber, channel: channel };
                    const assessment = JSON.stringify(requestBody.Data.Assessment);
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

                    const key = `${personPhoneNumber}:Assessment`;

                    if (channel === "telegram" || channel === "Telegram") {
                        assessmentSessionLogs.userMessageId = message_to_platform.message_id;
                    } else {
                        assessmentSessionLogs.userMessageId = message_to_platform.body.messages[0].id;
                    }
                    await CacheMemory.set(key, assessmentSessionLogs.userMessageId);

                    const AssessmentSession = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
                    await AssessmentSession.create(assessmentSessionLogs);

                    if (assessmentSessionLogs.userResponseType === "Text" ) {
                        await this.serveAssessmentService.updateMessageFlag(personPhoneNumber);
                    }

                    const message = "We are starting a symptom assessment for you please answer few of our questions.";
                    return this.getFullfillmentObj(message);

                }
            } else {
                const message = "Sorry for the inconvenience, could not find the no baby assessment template.";
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

}
