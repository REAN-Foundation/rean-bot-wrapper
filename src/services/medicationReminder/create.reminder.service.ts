import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';

@scoped(Lifecycle.ContainerScoped)
export class CreateReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
    ){}

    async createReminder (eventObj) {
        try {
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const medicineName : string = eventObj.body.queryResult.outputContexts[0].parameters.medicineName;
            const time = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            const dayName : string = eventObj.body.queryResult.outputContexts[0].parameters.dayName;
            const dffMessage = `Welcome ${personName}! \nI have successfully scheduled your medication reminder for *${medicineName}* every ${dayName} at ${time}.
            You will receive the reminder at the specified time. If you have any further questions or need assistance in the future, feel free to ask.
            \nTake care and stay healthy!`;

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    }
                ]
            };

            //Notify to volunteer
            const body : QueueDoaminModel =  {
                Intent : "M_Medication_Data_Yes",
                Body   : {
                    PersonName        : personName,
                    PersonPhoneNumber : personPhoneNumber,
                    MedicineName      : medicineName,
                    Time              : time,
                    DayName           : dayName,
                    EventObj          : eventObj
                }
            };
            FireAndForgetService.enqueue(body);
            return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

    async sendReminder (body, eventObj) {
        try {
            const message = `Hi ${body.PersonName}, \n\nThis is a medication reminder to take your *${body.MedicineName}*, on ${body.DayName} at ${body.Time}. \nIt's essential to follow your prescribed dosage and schedule for optimal health and treatment effectiveness. Take care and stay healthy!
            \nRegards\nREAN Foundation`;

            // const payload = {};

            // payload["buttonIds"] = await templateButtonService(["Schedule_Donation","NeedBlood_Patient_ByMistake"]);

            // payload["variables"] = [
            //     {
            //         type : "text",
            //         text : body.VolunteerName
            //     },
            //     {
            //         type : "text",
            //         text : body.PatientName
            //     }];
            // payload["templateName"] = "need_blood_notify_volunteer";
            // payload["languageForSession"] = "en";
            await FireAndForgetService.delay(4000);
            const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = previousPayload.source;
            response_format.sessionId = body.PersonPhoneNumber;
            response_format.messageText = message;
            response_format.message_type = "text";

            this._platformMessageService = eventObj.container.resolve(previousPayload.source);
            await this._platformMessageService.SendMediaMessage(response_format, null);
            
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

}
