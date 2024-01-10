import { scoped, Lifecycle, inject } from 'tsyringe';
import needle from "needle";
import { Logger } from '../../../common/logger';
import { platformServiceInterface } from '../../../refactor/interface/platform.interface';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { Helper } from '../../../common/helper';
import { AnswerYesMsgService } from '../../../services/maternalCareplan/serveAssessment/answer.yes.service';

@scoped(Lifecycle.ContainerScoped)
export class AppointmentUserReplyService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(AnswerYesMsgService) private answerYesMsgService?: AnswerYesMsgService,

    ){}

    async sendUserResponse (eventObj) {
        try {
            let msg = "";
            const intentName = eventObj.queryResult ? eventObj.queryResult.intent.displayName : null;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const phoneNumber = Helper.formatPhoneForDocProcessor(personPhoneNumber);
            const docProcessBaseURL = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DOCUMENT_PROCESSOR_BASE_URL");
            let todayDate = new Date().toISOString().split('T')[0];
            todayDate = Helper.removeLeadingZerosFromDay(todayDate);

            const getUrl = `${docProcessBaseURL}appointment-schedules/gmu/appointment-status/${phoneNumber}/days/${todayDate}`;
            const respnse =  await needle("get", getUrl);
            const previousMessageID =  respnse.body[0]["WhatsApp message id"];
            if (previousMessageID === "" ) {
                const apiUrl = `${docProcessBaseURL}appointment-schedules/gmu/appointment-status/${phoneNumber}/days/${todayDate}`;
                const obj = {
                    "WhatsApp_message_id" : previousMessageID,
                    "Patient_replied"     : intentName === "Reminder_Reply_Yes" ? "Yes" : " No"
                };
                await needle("put", apiUrl, obj);
                console.log(`Object in reply service ${obj}`);
                msg = intentName === "Reminder_Reply_Yes" ? this.answerYesMsgService.getRandomYesMessage() : "Thank you for your feedback.";
            } else {
                msg = "Sorry, to inform you the appointment has been passed.";
            }
            return { fulfillmentMessages: [{ text: { text: [msg] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

}