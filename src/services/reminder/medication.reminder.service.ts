import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { dialoflowMessageFormatting } from '../Dialogflow.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { whatsappMetaButtonService } from '../whatsappmeta.button.service';
import { GetPatientInfoService } from '../support.app.service';

@scoped(Lifecycle.ContainerScoped)
export class MedicationReminderService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,
        @inject(dialoflowMessageFormatting) private dialoflowMessageFormattingService?: dialoflowMessageFormatting,

    ){}

    async createReminder (eventObj) {
        try {
            const dayName : string = eventObj.body.queryResult.outputContexts[0].parameters.dayName;
            const time : string = eventObj.body.queryResult.outputContexts[0].parameters.time[0];

            // const result: any = await this.getPatientInfoService.getPatientsByPhoneNumberservice(eventObj);
            // const patientUserId = result.message[0].UserId;
            // const name = result.message[0].DisplayName;
            // console.log(dayName,personPhoneNumber, eventName ,frequency, time);
            // const whenDay = await TimeHelper.getDateString(new Date(time), DateStringFormat.YYYY_MM_DD);
            // const whenTime = new Date(time).toISOString()
            //     .split('T')[1];

            const medicineName : string = eventObj.body.queryResult.outputContexts[1].parameters.medicineName;

            const dffMessage = `Thank you for providing the name. To confirm, you would like a medication reminder for *${medicineName}* every ${dayName} at ${time}, correct?`;
            console.log(dffMessage);
            
            const payloadButtons = await whatsappMetaButtonService("Yes","M_Medication_Data_Yes","No","M_Medication_Data_No");
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                    payloadButtons
                ]
            };
            return await { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Send success reminder creation error');
        }
    }

}
