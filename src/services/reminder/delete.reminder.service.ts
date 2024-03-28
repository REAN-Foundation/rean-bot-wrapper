import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../common/logger';
import { NeedleService } from '../needle.service';
import { GetPatientInfoService } from '../support.app.service';

@scoped(Lifecycle.ContainerScoped)
export class DeleteReminderService {

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(GetPatientInfoService) private getPatientInfoService?: GetPatientInfoService,

    ){}

    async delete (eventObj) {
        try {
            const phoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const personName : string = eventObj.body.originalDetectIntentRequest.payload.userName;
            const channelName = eventObj.body.originalDetectIntentRequest.payload.source;

            const patientUserId = await this.getPatientInfoService.getPatientUserId(channelName,
                phoneNumber, personName);

            let message = null;
            const apiURL = `reminders/search?userId=${patientUserId}`;
            const responseBody = await this.needleService.needleRequestForREAN("get", apiURL);
            const reminderArray = responseBody.Data.Reminders.Items;
            const reminderArrayLength = reminderArray.length;
            if (reminderArrayLength === 0) {
                message = `Hi ${personName}, \nIt seems there are no reminders available to delete at the moment.`;
            } else {
                for (const reminder of reminderArray) {
                    const apiURL = `reminders/${reminder.id}`;
                    const responseBody = await this.needleService.needleRequestForREAN("delete", apiURL, null, null);
                }
                message = "You're welcome! All reminders have been successfully deleted. If you need any further assistance, feel free to ask!";
            }
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [message] }
                    }
                ]
            };
            return data;

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Ask time reminder service error');
        }
    }
}
