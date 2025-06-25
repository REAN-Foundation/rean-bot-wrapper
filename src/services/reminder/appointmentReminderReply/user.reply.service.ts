import { scoped, Lifecycle, inject } from 'tsyringe';
import needle from "needle";
import { Logger } from '../../../common/logger';
import { platformServiceInterface } from '../../../refactor/interface/platform.interface';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
//import { Helper } from '../../../common/helper';
import { AnswerYesMsgService } from '../../../services/maternalCareplan/serveAssessment/answer.yes.service';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import { ReminderMessage} from '../../../models/reminder.model';

@scoped(Lifecycle.ContainerScoped)
export class AppointmentUserReplyService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(AnswerYesMsgService) private answerYesMsgService?: AnswerYesMsgService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider

    ){}

    async sendUserResponse (eventObj) {
        try {
            let msg = "";
            const reminderMessage = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ReminderMessage);
            const intentName = eventObj.body.queryResult ? eventObj.body.queryResult.intent.displayName : null;
            //const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            //const phoneNumber = Helper.formatPhoneForDocProcessor(personPhoneNumber);
            const previousMessageContextID = eventObj.body.originalDetectIntentRequest.payload.contextId;
            const appRecord = await reminderMessage.findOne({
                where: { MessageId: previousMessageContextID },
                attributes: ['ParentActionId'],
                raw: true
            });
            const appointment_id = appRecord ? appRecord.ParentActionId : null;

            const docProcessBaseURL = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DOCUMENT_PROCESSOR_BASE_URL");

            // let todayDate = new Date().toISOString()
            //     .split('T')[0];
            // todayDate = Helper.removeLeadingZerosFromDay(todayDate);
            //const client = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

            // const getUrl = `${docProcessBaseURL}appointment-schedules/${client}/appointment-status/${phoneNumber}/days/${todayDate}`;
            // const respnse =  await needle("get", getUrl);

            // if (respnse.body.message){
            //     msg = "Sorry to inform you the appointment passed.";
            // } else {
            const userReply = intentName === "Reminder_Reply_Yes" ? "Yes" : "No";
            const updateUserReplyUrl = `${docProcessBaseURL}appointment-schedules/${appointment_id}/reminder-response`;
            const res = await needle("put",
                updateUserReplyUrl,
                {
                    channel_message_id : previousMessageContextID,
                    replied_status     : userReply },
                { headers : {
                    'Content-Type' : 'application/json',
                    Accept         : 'application/json',
                },
                },
            );
            console.log(`Object in reply service ${JSON.stringify(res.body,null, 4)}`);
            msg = intentName === "Reminder_Reply_Yes" ? "Thank you for the confirmation." : "Thank you for your feedback.";

            // }
            return { fulfillmentMessages: [{ text: { text: [msg] } }]  };
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'User reply on appointment service error');
        }
    }

}
