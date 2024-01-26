import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { FireAndForgetService, QueueDoaminModel } from '../fire.and.forget.service';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { Iresponse } from '../../refactor/interface/message.interface';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { sendApiButtonService } from '../whatsappmeta.button.service';

@scoped(Lifecycle.ContainerScoped)
export class CreateReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,
    ){}

    async createReminder (eventObj) {
        try {
            const patientName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const patientUserId : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const medicationName : string = eventObj.body.queryResult.outputContexts[0].parameters.medicineName;
            const time = eventObj.body.queryResult.outputContexts[0].parameters["time.original"];
            const dayName : string = eventObj.body.queryResult.outputContexts[0].parameters.dayName;
            const dffMessage = `Hello ${patientName}! \nI have successfully scheduled your medication reminder for *${medicationName}* every ${dayName} at ${time}.
            You will receive the reminder at the specified time.
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
                    PersonName        : patientName,
                    PersonPhoneNumber : patientUserId,
                    MedicineName      : medicationName,
                    Time              : time,
                    DayName           : dayName,
                    EventObj          : eventObj
                }
            };
            FireAndForgetService.enqueue(body);
            return { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Ask question medication reminder error');
        }
    }

    async sendReminder (body, eventObj) {
        try {
            const message = `Hello ${body.PersonName}, \n\nHave you taken your *${body.MedicineName}*, on this ${body.DayName} at ${body.Time}? \nIt's essential to follow your prescribed dosage and schedule for optimal health and treatment effectiveness. Take care and stay healthy!
            \nRegards\nREAN Foundation`;

            await FireAndForgetService.delay(4000);
            const payload = await sendApiButtonService(["Yes, I have taken", "M_Medication_Reminder_Yes", "No, I haven't taken", "M_Medication_Reminder_No"]);
            const previousPayload = eventObj.body.originalDetectIntentRequest.payload;
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.platform = previousPayload.source;
            response_format.sessionId = body.PersonPhoneNumber;
            response_format.messageText = message;
            response_format.message_type = "interactivebuttons";

            this._platformMessageService = eventObj.container.resolve(previousPayload.source);
            await this._platformMessageService.SendMediaMessage(response_format, payload);
            
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Ask question medication reminder service error');
        }
    }

}
