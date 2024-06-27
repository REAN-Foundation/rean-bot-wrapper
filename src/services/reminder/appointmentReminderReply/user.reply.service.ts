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
            const intentName = eventObj.body.queryResult ? eventObj.body.queryResult.intent.displayName : null;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const phoneNumber = Helper.formatPhoneForDocProcessor(personPhoneNumber);
            const previousMessageContextID = eventObj.body.originalDetectIntentRequest.payload.contextId;
            const docProcessBaseURL = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DOCUMENT_PROCESSOR_BASE_URL");
            let todayDate = new Date().toISOString()
                .split('T')[0];
            todayDate = Helper.removeLeadingZerosFromDay(todayDate);

            const getUrl = `${docProcessBaseURL}appointment-schedules/gghn/appointment-status/${phoneNumber}/days/${todayDate}`;
            const respnse =  await needle("get", getUrl);
            if (respnse.body.message){
                msg = "Sorry to inform you the appointment passed.";
            } else {
                const userReply = intentName === "Reminder_Reply_Yes" ? "Yes" : "No";
                const res = await needle("put",
                    getUrl,
                    { WhatsApp_message_id: previousMessageContextID, Patient_replied: userReply },
                    { headers : {
                        'Content-Type' : 'application/json',
                        Accept         : 'application/json',
                    },
                    },
                );
                console.log(`Object in reply service ${JSON.stringify(res.body,null, 4)}`);
                msg = intentName === "Reminder_Reply_Yes" ? "Thank you for the confirmation." : "Thank you for your feedback.";
            }
            return { fulfillmentMessages: [{ text: { text: [msg] } }]  };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'User reply on appointment service error');
        }
    }

}
